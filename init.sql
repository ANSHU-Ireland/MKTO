-- Initialize database with test data
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert test user
INSERT INTO users (email, hashed_password, is_active) VALUES 
('test@mkto.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewqyBW4CZkZbKbVS', true)
ON CONFLICT (email) DO NOTHING;

-- Insert test positions
INSERT INTO positions (user_id, symbol, quantity, avg_price) VALUES 
(1, 'AAPL.US', 100, 200.00),
(1, 'MSFT.US', 50, 340.00),
(1, 'GOOG.US', 25, 2700.00)
ON CONFLICT DO NOTHING;

-- Insert sample market data
INSERT INTO market_data (symbol, timestamp, open_price, high_price, low_price, close_price, volume, source) VALUES 
('AAPL.US', NOW() - INTERVAL '1 hour', 209.00, 210.50, 208.50, 209.75, 1000000, 'stooq'),
('MSFT.US', NOW() - INTERVAL '1 hour', 341.50, 343.00, 340.00, 342.25, 800000, 'stooq'),
('GOOG.US', NOW() - INTERVAL '1 hour', 2745.00, 2755.00, 2740.00, 2750.50, 500000, 'stooq')
ON CONFLICT DO NOTHING;
