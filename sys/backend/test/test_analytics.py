#!/usr/bin/env python3
"""
Basic tests for analytics endpoints.
"""
from db.database import SessionLocal
from analytics.analytics_router import AnalyticsEvent, EventContext, process_events_batch
from models.analytics_models import EventsRaw
from datetime import datetime, timezone

def main():
    print("=" * 80)
    print("🧪 Analytics Ingestion Test")
    print("=" * 80)
    db = SessionLocal()
    try:
        # Prepare a small batch
        events = [
            AnalyticsEvent(
                event_id=f"evt_test_{i}",
                event_type="page_view",
                user_id=1,
                anonymous_id="anon_test",
                session_id="sess_test",
                timestamp=datetime.now(timezone.utc),
                properties={"page_name": "all_groups"},
                context=EventContext(
                    url="http://localhost:5173/all-groups",
                    path="/all-groups",
                    user_agent="pytest",
                    referrer=None,
                    screen_resolution="1920x1080",
                    viewport_size="1280x720",
                    timezone="UTC",
                    language="en-US",
                    platform="web",
                    connection_type="wifi",
                ),
            )
            for i in range(3)
        ]
        process_events_batch(events, db)

        count = db.query(EventsRaw).filter(EventsRaw.session_id == "sess_test").count()
        print(f"✅ Inserted events count: {count}")
        assert count >= 1
    finally:
        db.close()

if __name__ == "__main__":
    main()

