INSERT INTO users (full_name, email, phone, password_hash, role, specialization, joining_date, is_active)
VALUES 
('System Owner', 'owner@salon.com', '1234567890', '$2a$10$9W5b8h5ukFR6eqDXnP1rX.oMwGmig1I7PoZej/37haU02SFg.N.Qy', 'OWNER', NULL, '2026-05-01', TRUE),
('Branch Manager', 'manager@salon.com', '1234567891', '$2a$10$9W5b8h5ukFR6eqDXnP1rX.oMwGmig1I7PoZej/37haU02SFg.N.Qy', 'MANAGER', NULL, '2026-05-01', TRUE),
('Front Desk Cashier', 'receptionist@salon.com', '1234567892', '$2a$10$9W5b8h5ukFR6eqDXnP1rX.oMwGmig1I7PoZej/37haU02SFg.N.Qy', 'FRONT_DESK', NULL, '2026-05-01', TRUE),
('Stylist Alex', 'therapist@salon.com', '1234567893', '$2a$10$9W5b8h5ukFR6eqDXnP1rX.oMwGmig1I7PoZej/37haU02SFg.N.Qy', 'THERAPIST', 'Hair Styling', '2026-05-01', TRUE);
