-- V4__seed_service_catalog.sql
-- Is migration mein hum initial service categories, services, aur combo packages seed karenge taaki user interface test karna aasan ho sake.

-- 1. Insert Categories
-- Hair (Parent Category)
INSERT INTO service_categories (name, parent_id) VALUES ('Hair Care', NULL);
-- Face & Skin (Parent Category)
INSERT INTO service_categories (name, parent_id) VALUES ('Face & Skin Care', NULL);

-- Sub categories for Hair Care (ID 1)
INSERT INTO service_categories (name, parent_id) 
VALUES ('Hair Cuts', (SELECT id FROM service_categories WHERE name = 'Hair Care' LIMIT 1));

INSERT INTO service_categories (name, parent_id) 
VALUES ('Hair Treatments', (SELECT id FROM service_categories WHERE name = 'Hair Care' LIMIT 1));

-- Sub categories for Face & Skin (ID 2)
INSERT INTO service_categories (name, parent_id) 
VALUES ('Facials', (SELECT id FROM service_categories WHERE name = 'Face & Skin Care' LIMIT 1));


-- 2. Insert Services
-- Services under 'Hair Cuts'
INSERT INTO services (category_id, name, description, base_price, member_price, weekend_price, duration_minutes, gst_percent, is_active)
VALUES (
    (SELECT id FROM service_categories WHERE name = 'Hair Cuts' LIMIT 1),
    'Men''s Classic Haircut',
    'Standard professional haircut with hairwash and styling.',
    350.00, 300.00, 380.00,
    30, 18.00, TRUE
);

INSERT INTO services (category_id, name, description, base_price, member_price, weekend_price, duration_minutes, gst_percent, is_active)
VALUES (
    (SELECT id FROM service_categories WHERE name = 'Hair Cuts' LIMIT 1),
    'Women''s Stylist Haircut',
    'Premium style haircut by senior stylist, includes blow dry.',
    850.00, 750.00, 900.00,
    45, 18.00, TRUE
);

-- Services under 'Hair Treatments'
INSERT INTO services (category_id, name, description, base_price, member_price, weekend_price, duration_minutes, gst_percent, is_active)
VALUES (
    (SELECT id FROM service_categories WHERE name = 'Hair Treatments' LIMIT 1),
    'Keratin Spa Treatment',
    'Revitalizing keratin spa treatment for smooth and frizz-free hair.',
    3200.00, 2900.00, 3500.00,
    90, 18.00, TRUE
);

-- Services under 'Facials'
INSERT INTO services (category_id, name, description, base_price, member_price, weekend_price, duration_minutes, gst_percent, is_active)
VALUES (
    (SELECT id FROM service_categories WHERE name = 'Facials' LIMIT 1),
    'Gold Radiance Facial',
    'Luxury gold facial to bring glowing radiance to facial skin, includes face massage.',
    1800.00, 1600.00, 1950.00,
    60, 18.00, TRUE
);


-- 3. Insert Service Packages (Combos)
-- Package 1: Grooming Combo (Men's Haircut + Gold Radiance Facial)
INSERT INTO service_packages (name, package_price, gst_percent, is_active)
VALUES ('Classic Grooming Combo', 1800.00, 18.00, TRUE);

-- Link Services to Classic Grooming Combo Package
INSERT INTO package_items (package_id, service_id)
VALUES (
    (SELECT id FROM service_packages WHERE name = 'Classic Grooming Combo' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Men''s Classic Haircut' LIMIT 1)
);
INSERT INTO package_items (package_id, service_id)
VALUES (
    (SELECT id FROM service_packages WHERE name = 'Classic Grooming Combo' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Gold Radiance Facial' LIMIT 1)
);

-- Package 2: Premium Hair Care Pack (Women's Haircut + Keratin Spa Treatment)
INSERT INTO service_packages (name, package_price, gst_percent, is_active)
VALUES ('Premium Hair Care Pack', 3500.00, 18.00, TRUE);

-- Link Services to Premium Hair Care Pack Package
INSERT INTO package_items (package_id, service_id)
VALUES (
    (SELECT id FROM service_packages WHERE name = 'Premium Hair Care Pack' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Women''s Stylist Haircut' LIMIT 1)
);
INSERT INTO package_items (package_id, service_id)
VALUES (
    (SELECT id FROM service_packages WHERE name = 'Premium Hair Care Pack' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Keratin Spa Treatment' LIMIT 1)
);
