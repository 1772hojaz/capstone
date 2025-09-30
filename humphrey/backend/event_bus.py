"""
Event Bus for SPACS AFRICA.
Handles event-driven communication using Redis Pub/Sub.
"""

import redis
import json
import os
from typing import Dict, Any, Callable, Optional
from datetime import datetime
import logging
import asyncio
from uuid import UUID

logger = logging.getLogger(__name__)

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

class EventBus:
    """
    Simple event bus using Redis Pub/Sub for event-driven architecture.
    """
    
    def __init__(self, redis_url: str = REDIS_URL):
        """Initialize event bus with Redis connection."""
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.pubsub = self.redis_client.pubsub()
        self.event_handlers = {}
        
    def publish(self, event_type: str, entity_type: str, entity_id: UUID, payload: Optional[Dict] = None):
        """
        Publish an event to the event bus.
        
        Args:
            event_type: Type of event (e.g., 'new_transaction', 'user_joined_group')
            entity_type: Type of entity (e.g., 'user', 'group', 'transaction')
            entity_id: ID of the entity
            payload: Additional event data
        """
        event_data = {
            'event_type': event_type,
            'entity_type': entity_type,
            'entity_id': str(entity_id),
            'payload': payload or {},
            'timestamp': datetime.now().isoformat()
        }
        
        # Publish to Redis channel
        channel = f"events:{event_type}"
        self.redis_client.publish(channel, json.dumps(event_data))
        
        # Also log to database for persistence
        self._log_event_to_db(event_data)
        
        logger.info(f"Published event: {event_type} for {entity_type} {entity_id}")
    
    def subscribe(self, event_type: str, handler: Callable):
        """
        Subscribe to an event type with a handler function.
        
        Args:
            event_type: Type of event to listen for
            handler: Function to call when event is received
        """
        channel = f"events:{event_type}"
        self.event_handlers[channel] = handler
        self.pubsub.subscribe(channel)
        logger.info(f"Subscribed to {event_type} events")
    
    def listen(self):
        """
        Start listening for events (blocking).
        Run this in a background thread or async task.
        """
        logger.info("Event bus listening for messages...")
        for message in self.pubsub.listen():
            if message['type'] == 'message':
                channel = message['channel']
                data = json.loads(message['data'])
                
                # Call registered handler
                if channel in self.event_handlers:
                    try:
                        self.event_handlers[channel](data)
                    except Exception as e:
                        logger.error(f"Error handling event {channel}: {e}")
    
    def _log_event_to_db(self, event_data: Dict[str, Any]):
        """Log event to database for audit trail."""
        try:
            from database import execute_raw_sql
            
            query = """
                INSERT INTO events_log (event_type, entity_type, entity_id, payload, processed, created_at)
                VALUES (:event_type, :entity_type, :entity_id::uuid, :payload::jsonb, FALSE, NOW())
            """
            
            params = {
                'event_type': event_data['event_type'],
                'entity_type': event_data['entity_type'],
                'entity_id': event_data['entity_id'],
                'payload': json.dumps(event_data['payload'])
            }
            
            execute_raw_sql(query, params)
        except Exception as e:
            logger.error(f"Failed to log event to database: {e}")


# Global event bus instance
event_bus = EventBus()


# ========================================
# Event Type Constants
# ========================================

class EventTypes:
    """Constants for event types."""
    NEW_USER = "new_user"
    NEW_TRANSACTION = "new_transaction"
    USER_JOINED_GROUP = "user_joined_group"
    GROUP_FORMED = "group_formed"
    GROUP_COMPLETED = "group_completed"
    RECOMMENDATION_CREATED = "recommendation_created"
    RECOMMENDATION_ACCEPTED = "recommendation_accepted"
    CLUSTER_UPDATED = "cluster_updated"


# ========================================
# Event Handlers
# ========================================

def handle_new_transaction(event_data: Dict[str, Any]):
    """Handle new transaction event - update user features."""
    logger.info(f"Handling new transaction event: {event_data}")
    
    try:
        from database import execute_raw_sql
        
        user_id = event_data['entity_id']
        payload = event_data.get('payload', {})
        
        # Update feature store
        query = """
            WITH transaction_stats AS (
                SELECT 
                    user_id,
                    COUNT(*)::DECIMAL / NULLIF(EXTRACT(EPOCH FROM (MAX(transaction_date) - MIN(transaction_date))) / 604800, 0) as purchase_frequency,
                    AVG(total_price) as avg_transaction_value,
                    COUNT(*) as total_transactions,
                    SUM(total_price) as total_spent,
                    MAX(transaction_date) as last_purchase_date
                FROM transactions
                WHERE user_id = :user_id::uuid
                GROUP BY user_id
            )
            INSERT INTO feature_store (
                user_id, purchase_frequency, avg_transaction_value, 
                total_transactions, total_spent, last_purchase_date, updated_at
            )
            SELECT 
                :user_id::uuid, 
                COALESCE(purchase_frequency, 0),
                COALESCE(avg_transaction_value, 0),
                COALESCE(total_transactions, 0),
                COALESCE(total_spent, 0),
                last_purchase_date,
                NOW()
            FROM transaction_stats
            ON CONFLICT (user_id)
            DO UPDATE SET
                purchase_frequency = EXCLUDED.purchase_frequency,
                avg_transaction_value = EXCLUDED.avg_transaction_value,
                total_transactions = EXCLUDED.total_transactions,
                total_spent = EXCLUDED.total_spent,
                last_purchase_date = EXCLUDED.last_purchase_date,
                updated_at = NOW()
        """
        
        execute_raw_sql(query, {'user_id': user_id})
        logger.info(f"Updated features for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error handling new transaction: {e}")


def handle_user_joined_group(event_data: Dict[str, Any]):
    """Handle user joined group event - check if group is complete."""
    logger.info(f"Handling user joined group event: {event_data}")
    
    try:
        from database import execute_raw_sql
        
        payload = event_data.get('payload', {})
        group_id = payload.get('group_id')
        
        if not group_id:
            return
        
        # Check if group has reached target
        query = """
            SELECT 
                id, current_quantity, target_quantity, status
            FROM bulk_groups
            WHERE id = :group_id::uuid
        """
        
        result = execute_raw_sql(query, {'group_id': group_id})
        
        if result and result[0]['current_quantity'] >= result[0]['target_quantity']:
            # Close the group
            update_query = """
                UPDATE bulk_groups
                SET status = 'closed'
                WHERE id = :group_id::uuid
            """
            execute_raw_sql(update_query, {'group_id': group_id})
            
            # Publish group formed event
            event_bus.publish(
                EventTypes.GROUP_COMPLETED,
                'group',
                UUID(group_id),
                {'group_id': group_id}
            )
            
            logger.info(f"Group {group_id} marked as closed")
            
    except Exception as e:
        logger.error(f"Error handling user joined group: {e}")


def handle_group_completed(event_data: Dict[str, Any]):
    """Handle group completed event - send notifications to members."""
    logger.info(f"Handling group completed event: {event_data}")
    
    try:
        from database import execute_raw_sql
        
        payload = event_data.get('payload', {})
        group_id = payload.get('group_id')
        
        # Get all group members
        query = """
            SELECT gm.user_id, u.full_name, bg.group_name, p.name as product_name
            FROM group_memberships gm
            JOIN users u ON gm.user_id = u.id
            JOIN bulk_groups bg ON gm.group_id = bg.id
            JOIN products p ON bg.product_id = p.id
            WHERE gm.group_id = :group_id::uuid
        """
        
        members = execute_raw_sql(query, {'group_id': group_id})
        
        # Create notifications for all members
        for member in members:
            notification_query = """
                INSERT INTO notifications (
                    user_id, notification_type, title, message, is_read, created_at
                )
                VALUES (
                    :user_id::uuid,
                    'group_completed',
                    :title,
                    :message,
                    FALSE,
                    NOW()
                )
            """
            
            execute_raw_sql(notification_query, {
                'user_id': member['user_id'],
                'title': 'Bulk Group Completed!',
                'message': f"The {member['group_name']} for {member['product_name']} has reached its target. Your order will be processed soon."
            })
        
        logger.info(f"Sent notifications to {len(members)} group members")
        
    except Exception as e:
        logger.error(f"Error handling group completed: {e}")


# Register event handlers
def register_event_handlers():
    """Register all event handlers with the event bus."""
    event_bus.subscribe(EventTypes.NEW_TRANSACTION, handle_new_transaction)
    event_bus.subscribe(EventTypes.USER_JOINED_GROUP, handle_user_joined_group)
    event_bus.subscribe(EventTypes.GROUP_COMPLETED, handle_group_completed)
    logger.info("Event handlers registered")


if __name__ == "__main__":
    # Test event bus
    print("Testing Event Bus...")
    
    from uuid import uuid4
    
    test_user_id = uuid4()
    
    # Publish a test event
    event_bus.publish(
        EventTypes.NEW_USER,
        'user',
        test_user_id,
        {'email': 'test@example.com'}
    )
    
    print("✓ Event published successfully")
    print("Note: Full event handling requires Redis and database connection")
