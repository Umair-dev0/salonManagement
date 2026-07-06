-- V3__create_service_catalog_tables.sql
-- Is migration mein hum service categories, services, packages aur package items ki tables create karenge.

-- 1. Service Categories Table (Self-referencing for Hierarchical Category Structure)
CREATE TABLE service_categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    parent_id BIGINT REFERENCES service_categories(id) ON DELETE SET NULL, -- Agar parent delete ho, toh subcategory null ho jaye parent_id pe
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Services Table
CREATE TABLE services (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE, -- Agar category delete ho, toh saari services delete ho jayein
    name VARCHAR(150) NOT NULL,
    description TEXT,
    base_price NUMERIC(12,2) NOT NULL,
    member_price NUMERIC(12,2),
    weekend_price NUMERIC(12,2),
    duration_minutes INTEGER NOT NULL,
    gst_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Service Packages Table (Combo packages)
CREATE TABLE service_packages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    package_price NUMERIC(12,2) NOT NULL,
    gst_percent NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Package Items Table (Many-to-Many join table linking Packages and Services)
CREATE TABLE package_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    package_id BIGINT NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
    service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
