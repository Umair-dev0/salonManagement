-- V10__create_membership_and_loyalty_tables.sql

CREATE TABLE membership_plans (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tier VARCHAR(50) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    wallet_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    validity_days INTEGER NOT NULL DEFAULT 365,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_memberships (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    plan_id BIGINT REFERENCES membership_plans(id) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMPTZ NOT NULL,
    wallet_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loyalty_transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    txn_type VARCHAR(20) NOT NULL, -- EARN, REDEEM
    points INTEGER NOT NULL,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupons (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- PERCENT, FLAT
    value NUMERIC(12,2) NOT NULL,
    min_bill_amount NUMERIC(12,2) DEFAULT 0.00,
    max_discount NUMERIC(12,2),
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupon_usages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    coupon_id BIGINT REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Membership Plans
INSERT INTO membership_plans (name, tier, price, discount_percent, wallet_value, validity_days, is_active)
VALUES
('Gold Tier Privilege', 'GOLD', 2500.00, 10.00, 500.00, 365, TRUE),
('Platinum Luxe Club', 'PLATINUM', 5000.00, 20.00, 1500.00, 365, TRUE),
('Royal Elite Membership', 'ELITE', 10000.00, 30.00, 3500.00, 365, TRUE);

-- Seed Default Coupons
INSERT INTO coupons (code, discount_type, value, min_bill_amount, max_discount, max_uses, used_count, valid_from, valid_to, is_active)
VALUES
('WELCOME10', 'PERCENT', 10.00, 500.00, 200.00, 100, 0, NOW(), NOW() + INTERVAL '1 year', TRUE),
('LUXE500', 'FLAT', 500.00, 2000.00, 500.00, 50, 0, NOW(), NOW() + INTERVAL '1 year', TRUE),
('FESTIVE20', 'PERCENT', 20.00, 1000.00, 1000.00, 200, 0, NOW(), NOW() + INTERVAL '1 year', TRUE);

-- Seed Initial Loyalty Transactions for existing customers
INSERT INTO loyalty_transactions (customer_id, txn_type, points, invoice_id, notes)
SELECT id, 'EARN', loyalty_points, NULL, 'Initial balance imported'
FROM customers
WHERE loyalty_points > 0;
