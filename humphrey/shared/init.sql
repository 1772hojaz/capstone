-- SPACS AFRICA Database Schema
-- PostgreSQL initialization script
-- This script creates all tables, indexes, and initial data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Core Tables
-- ========================================

-- Users/Traders Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- e.g., 'kg', 'bag', 'liter'
    base_price DECIMAL(10, 2) NOT NULL, -- Individual unit price
    bulk_price DECIMAL(10, 2) NOT NULL, -- Price per unit when bought in bulk
    min_bulk_quantity INTEGER NOT NULL DEFAULT 10, -- Minimum quantity for bulk discount
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'individual' or 'bulk'
    bulk_group_id UUID, -- NULL for individual purchases
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bulk Purchase Groups Table
CREATE TABLE IF NOT EXISTS bulk_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    group_name VARCHAR(255) NOT NULL,
    target_quantity INTEGER NOT NULL,
    current_quantity INTEGER DEFAULT 0,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'closed', 'completed'
    deadline TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Group Memberships Table
CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES bulk_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity_committed INTEGER NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- ========================================
-- ML & Recommendation Tables
-- ========================================

-- User Clusters Table
CREATE TABLE IF NOT EXISTS user_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cluster_id INTEGER NOT NULL,
    cluster_name VARCHAR(100), -- e.g., "High-frequency Rice Buyers"
    features JSONB NOT NULL, -- Store feature vector as JSON
    confidence_score DECIMAL(5, 4),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    model_version VARCHAR(50) NOT NULL DEFAULT 'v1.0'
);

-- Feature Store Table
CREATE TABLE IF NOT EXISTS feature_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purchase_frequency DECIMAL(10, 4), -- Purchases per week
    avg_transaction_value DECIMAL(10, 2),
    price_sensitivity DECIMAL(5, 4), -- 0-1 score
    product_preferences JSONB, -- {product_id: affinity_score}
    location_encoded INTEGER, -- Encoded location for clustering
    total_transactions INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    last_purchase_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES bulk_groups(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL, -- 'join_group', 'new_group', 'product'
    score DECIMAL(5, 4) NOT NULL, -- Confidence score 0-1
    explanation TEXT NOT NULL, -- Human-readable explanation
    feature_importance JSONB, -- SHAP values for internal use
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    actioned_at TIMESTAMP
);

-- Model Metadata Table
CREATE TABLE IF NOT EXISTS model_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_type VARCHAR(50) NOT NULL, -- 'clustering', 'recommender'
    model_version VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    metrics JSONB, -- Precision, Recall, etc.
    training_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- ========================================
-- System & Audit Tables
-- ========================================

-- Events Log Table (for event-driven architecture)
CREATE TABLE IF NOT EXISTS events_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- 'new_transaction', 'user_joined_group', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'group', 'transaction'
    entity_id UUID NOT NULL,
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- ========================================
-- Indexes for Performance
-- ========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_bulk_group ON transactions(bulk_group_id);

-- Bulk groups indexes
CREATE INDEX IF NOT EXISTS idx_bulk_groups_product_id ON bulk_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_bulk_groups_status ON bulk_groups(status);
CREATE INDEX IF NOT EXISTS idx_bulk_groups_deadline ON bulk_groups(deadline);

-- Group memberships indexes
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);

-- User clusters indexes
CREATE INDEX IF NOT EXISTS idx_user_clusters_user_id ON user_clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clusters_cluster_id ON user_clusters(cluster_id);

-- Feature store indexes
CREATE INDEX IF NOT EXISTS idx_feature_store_user_id ON feature_store(user_id);

-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);

-- Events log indexes
CREATE INDEX IF NOT EXISTS idx_events_log_type ON events_log(event_type);
CREATE INDEX IF NOT EXISTS idx_events_log_processed ON events_log(processed);
CREATE INDEX IF NOT EXISTS idx_events_log_created_at ON events_log(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ========================================
-- Initial Seed Data
-- ========================================

-- Insert sample products
INSERT INTO products (name, description, category, unit, base_price, bulk_price, min_bulk_quantity, image_url) VALUES
('Rice - 50kg Bag', 'Premium white rice, 50kg bag', 'Grains', 'bag', 45.00, 36.00, 10, 'https://images.unsplash.com/photo-1586201375761-83865001e31c'),
('Cooking Oil - 5L', 'Refined vegetable cooking oil', 'Cooking Essentials', 'bottle', 12.50, 10.00, 15, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'),
('Sugar - 25kg Bag', 'Refined white sugar', 'Grains', 'bag', 30.00, 24.00, 12, 'https://images.unsplash.com/photo-1514160955-34a1e9d45241'),
('Maize Flour - 10kg', 'White maize flour for cooking', 'Grains', 'bag', 18.00, 15.00, 20, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b'),
('Beans - 25kg Bag', 'Dry kidney beans', 'Pulses', 'bag', 35.00, 28.00, 10, 'https://images.unsplash.com/photo-1589630076131-722e5ebdb6ee'),
('Tomato Paste - 24 Cans', 'Tomato paste in bulk pack', 'Canned Goods', 'pack', 20.00, 16.00, 15, 'https://images.unsplash.com/photo-1546548970-71785318a17b'),
('Salt - 50kg Bag', 'Iodized table salt', 'Cooking Essentials', 'bag', 15.00, 12.00, 20, 'https://images.unsplash.com/photo-1586201375761-83865001e31c'),
('Pasta - 20kg Box', 'Dry pasta mix', 'Grains', 'box', 25.00, 20.00, 10, 'https://images.unsplash.com/photo-1551462147-37926e4ea0cd')
ON CONFLICT DO NOTHING;

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt
INSERT INTO users (email, password_hash, full_name, business_name, is_admin, is_active) VALUES
('admin@spacsafrica.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO', 'System Administrator', 'SPACS Africa Admin', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- Functions & Triggers
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_groups_updated_at BEFORE UPDATE ON bulk_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_store_updated_at BEFORE UPDATE ON feature_store
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update group quantity when member joins
CREATE OR REPLACE FUNCTION update_group_quantity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bulk_groups
    SET current_quantity = current_quantity + NEW.quantity_committed
    WHERE id = NEW.group_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_quantity_on_join AFTER INSERT ON group_memberships
    FOR EACH ROW EXECUTE FUNCTION update_group_quantity();

-- ========================================
-- Views for Analytics
-- ========================================

-- View: Active groups with member count
CREATE OR REPLACE VIEW active_groups_summary AS
SELECT 
    bg.id,
    bg.group_name,
    p.name AS product_name,
    bg.target_quantity,
    bg.current_quantity,
    bg.discount_percentage,
    bg.deadline,
    COUNT(gm.id) AS member_count,
    bg.status
FROM bulk_groups bg
JOIN products p ON bg.product_id = p.id
LEFT JOIN group_memberships gm ON bg.id = gm.group_id
WHERE bg.status = 'open'
GROUP BY bg.id, p.name;

-- View: User purchase statistics
CREATE OR REPLACE VIEW user_purchase_stats AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.business_name,
    COUNT(t.id) AS total_transactions,
    SUM(t.total_price) AS total_spent,
    AVG(t.total_price) AS avg_transaction_value,
    MAX(t.transaction_date) AS last_purchase_date
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id;

-- View: Product popularity
CREATE OR REPLACE VIEW product_popularity AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.category,
    COUNT(t.id) AS total_purchases,
    SUM(t.quantity) AS total_quantity_sold,
    SUM(t.total_price) AS total_revenue
FROM products p
LEFT JOIN transactions t ON p.id = t.product_id
GROUP BY p.id
ORDER BY total_purchases DESC;

-- ========================================
-- Grants & Permissions
-- ========================================

-- Grant permissions to application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO spacs_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spacs_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO spacs_user;

-- ========================================
-- Schema Version
-- ========================================

CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES
('1.0.0', 'Initial schema with all core tables, indexes, and views')
ON CONFLICT (version) DO NOTHING;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'SPACS AFRICA database schema initialized successfully!';
END $$;
