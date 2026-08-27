CREATE TABLE customers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150),
    gender VARCHAR(10),
    date_of_birth DATE,
    anniversary DATE,
    preferred_stylist_id BIGINT REFERENCES users(id),
    allergies TEXT,
    notes TEXT,
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial customers for testing
INSERT INTO customers (full_name, mobile, email, gender, date_of_birth, anniversary, preferred_stylist_id, allergies, notes, loyalty_points, is_active)
VALUES
('Ali Khan', '03001234567', 'ali.khan@gmail.com', 'MALE', '1995-08-15', '2020-04-12', (SELECT id FROM users WHERE role = 'THERAPIST' LIMIT 1), 'None', 'Prefers head massage with olive oil', 120, TRUE),
('Ayesha Malik', '03217654321', 'ayesha.m@yahoo.com', 'FEMALE', '1998-11-22', NULL, NULL, 'Gluten allergy', 'Wants quiet environment during facial', 250, TRUE);
