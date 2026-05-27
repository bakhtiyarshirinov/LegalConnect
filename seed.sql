-- =============================================================================
-- LegalConnect — Seed Data
-- Password for ALL users: Test!123
-- BCrypt hash (work factor 11, BCrypt.Net-Next 4.2.0):
--   $2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.
--
-- Run: docker exec -i legalconnect-db psql -U postgres -d legalconnect < seed.sql
--
-- NOTES:
--   • EF Core creates columns with PascalCase identifiers (quoted in PostgreSQL).
--     All column names must be double-quoted in raw SQL.
--   • "Specializations" table already exists with 8 rows — only UPDATE/INSERT.
--   • Role is stored as TEXT: 'Admin' | 'Lawyer' | 'Client'  (HasConversion<string>)
--   • Actual Specialization IDs in this DB:
--       1=Criminal Law  2=Family Law   3=Corporate Law  4=Real Estate Law
--       5=Immigration Law  6=Tax Law  7=Labor Law  8=Civil Law
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1.  CLEAN UP  (reverse FK dependency order; CASCADE handles nested deps)
-- =============================================================================
TRUNCATE TABLE
    messages,
    notifications,
    otp_codes,
    reviews,
    appointments,
    chats,
    lawyer_specializations,
    lawyers,
    users
CASCADE;

-- =============================================================================
-- 2.  SPECIALIZATIONS  — upsert so the script is idempotent
-- =============================================================================
INSERT INTO "Specializations" ("Id", "Name", "Description") VALUES
    (1, 'Criminal Law',    'Defense and prosecution in criminal cases'),
    (2, 'Family Law',      'Divorce, custody, and family disputes'),
    (3, 'Corporate Law',   'Business formation, contracts, and corporate compliance'),
    (4, 'Real Estate Law', 'Property transactions, disputes, and real estate contracts'),
    (5, 'Immigration Law', 'Visas, citizenship, work permits, and deportation cases'),
    (6, 'Tax Law',         'Tax planning, compliance, and dispute resolution'),
    (7, 'Labor Law',       'Employment rights, workplace disputes, and labor contracts'),
    (8, 'Civil Law',       'General civil disputes, torts, and civil litigation')
ON CONFLICT ("Id") DO UPDATE
    SET "Name"        = EXCLUDED."Name",
        "Description" = EXCLUDED."Description";

-- Keep IDENTITY sequence in sync
SELECT setval(
    pg_get_serial_sequence('"Specializations"', 'Id'),
    GREATEST(8, (SELECT COALESCE(MAX("Id"), 8) FROM "Specializations")),
    true
);

-- =============================================================================
-- 3.  USERS
--     Fixed UUIDs:
--       Admin       → 00000000-0000-0000-0000-000000000001
--       Clients     → 00000000-0000-0000-0000-00000000000{2,3,4}
--       Lawyers     → 00000000-0000-0000-0000-00000000000{5,6,7,8,9}
-- =============================================================================
INSERT INTO users
    ("Id", "Email", "PasswordHash", "FullName", "Phone",
     "Role", "AvatarUrl", "IsVerified", "CreatedAt")
VALUES

-- ── Admin ─────────────────────────────────────────────────────────────────────
(
    '00000000-0000-0000-0000-000000000001',
    'admin@legalconnect.az',
    '$2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.',
    'Admin User',
    NULL,
    'Admin',
    NULL,
    TRUE,
    '2025-01-01 00:00:00+00'
),

-- ── Clients ───────────────────────────────────────────────────────────────────
(
    '00000000-0000-0000-0000-000000000002',
    'anar@test.az',
    '$2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.',
    'Anar Həsənov',
    '+994501234567',
    'Client',
    NULL,
    TRUE,
    '2025-02-10 09:00:00+00'
),
(
    '00000000-0000-0000-0000-000000000003',
    'leyla@test.az',
    '$2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.',
    'Leyla Məmmədova',
    '+994552345678',
    'Client',
    NULL,
    TRUE,
    '2025-02-15 11:30:00+00'
),
(
    '00000000-0000-0000-0000-000000000004',
    'tural@test.az',
    '$2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.',
    'Tural İsmayılov',
    '+994703456789',
    'Client',
    NULL,
    TRUE,
    '2025-02-20 14:00:00+00'
),

-- ── Lawyer users ──────────────────────────────────────────────────────────────
(
    '00000000-0000-0000-0000-000000000005',
    'kamran@test.az',
    '$2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.',
    'Kamran Əliyev',
    '+994514567890',
    'Lawyer',
    NULL,
    TRUE,
    '2025-01-15 08:00:00+00'
),
(
    '00000000-0000-0000-0000-000000000006',
    'nigar@test.az',
    '$2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.',
    'Nigar Hüseynova',
    '+994555678901',
    'Lawyer',
    NULL,
    TRUE,
    '2025-01-20 09:30:00+00'
),
(
    '00000000-0000-0000-0000-000000000007',
    'rauf@test.az',
    '$2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.',
    'Rauf Quliyev',
    '+994706789012',
    'Lawyer',
    NULL,
    TRUE,
    '2025-01-10 07:00:00+00'
),
(
    '00000000-0000-0000-0000-000000000008',
    'sebine@test.az',
    '$2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.',
    'Səbinə Rzayeva',
    '+994517890123',
    'Lawyer',
    NULL,
    TRUE,
    '2025-03-05 10:00:00+00'
),
(
    '00000000-0000-0000-0000-000000000009',
    'elchin@test.az',
    '$2a$11$uF4tqep45FR8h7yoVOkVrekSfdVhF2ECWJzrA1gipcTodvATDIxe.',
    'Elçin Babayev',
    '+994558901234',
    'Lawyer',
    NULL,
    TRUE,
    '2025-02-01 08:45:00+00'
);

-- =============================================================================
-- 4.  LAWYER PROFILES
--     Fixed UUIDs: 00000000-0000-0000-0001-00000000000{1-5}
--     "Rating" is REAL (float),  "HourlyRate" is numeric(10,2)
-- =============================================================================
INSERT INTO lawyers
    ("Id", "UserId", "Bio", "City", "LicenseNumber", "ExperienceYears",
     "HourlyRate", "Rating", "ReviewCount", "IsVerified", "IsAvailable")
VALUES

-- Kamran Əliyev  ──────────────────────────────────────────────────────────────
(
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000005',
    'Experienced criminal lawyer with 10 years in Baku courts. '
    'Successfully defended clients in over 200 criminal cases including '
    'white-collar crime, fraud, and high-profile criminal defense.',
    'Baku',
    'AZ-2015-001',
    10,
    150.00,
    4.8,
    24,
    TRUE,
    TRUE
),

-- Nigar Hüseynova  ────────────────────────────────────────────────────────────
(
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000006',
    'Family law specialist helping families navigate difficult situations '
    'with compassion and professionalism. Expert in divorce proceedings, '
    'child custody disputes, and inheritance law.',
    'Baku',
    'AZ-2018-002',
    7,
    120.00,
    4.9,
    31,
    TRUE,
    TRUE
),

-- Rauf Quliyev  ───────────────────────────────────────────────────────────────
(
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000007',
    'Corporate law expert with experience in international business. '
    'Advises enterprises on mergers, acquisitions, joint ventures, '
    'and complex commercial contracts across multiple jurisdictions.',
    'Ganja',
    'AZ-2012-003',
    13,
    200.00,
    4.7,
    18,
    TRUE,
    TRUE
),

-- Səbinə Rzayeva  ─────────────────────────────────────────────────────────────
(
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000008',
    'Real estate and property law specialist in Azerbaijan. '
    'Extensive knowledge of local property regulations, land registry '
    'procedures, and commercial lease agreements.',
    'Baku',
    'AZ-2019-004',
    6,
    100.00,
    4.6,
    12,
    FALSE,
    TRUE
),

-- Elçin Babayev  ──────────────────────────────────────────────────────────────
(
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0000-000000000009',
    'Immigration lawyer helping clients with visa applications, work permits, '
    'permanent residency, and citizenship matters. Extensive experience with '
    'Azerbaijani and international immigration law.',
    'Sumqayıt',
    'AZ-2016-005',
    9,
    130.00,
    4.5,
    9,
    FALSE,
    TRUE
);

-- =============================================================================
-- 5.  LAWYER SPECIALIZATIONS  (junction table)
--
--     Actual IDs in this DB:
--       1=Criminal Law  2=Family Law   3=Corporate Law  4=Real Estate Law
--       5=Immigration   6=Tax Law      7=Labor Law      8=Civil Law
-- =============================================================================
INSERT INTO lawyer_specializations ("LawyerId", "SpecializationId") VALUES

-- Kamran: Criminal Law (1) + Civil Law (8)
('00000000-0000-0000-0001-000000000001', 1),
('00000000-0000-0000-0001-000000000001', 8),

-- Nigar: Family Law (2) + Labor Law (7)
('00000000-0000-0000-0001-000000000002', 2),
('00000000-0000-0000-0001-000000000002', 7),

-- Rauf: Corporate Law (3) + Tax Law (6)
('00000000-0000-0000-0001-000000000003', 3),
('00000000-0000-0000-0001-000000000003', 6),

-- Səbinə: Real Estate Law (4)
('00000000-0000-0000-0001-000000000004', 4),

-- Elçin: Immigration Law (5) + Civil Law (8)
('00000000-0000-0000-0001-000000000005', 5),
('00000000-0000-0000-0001-000000000005', 8);

COMMIT;

-- =============================================================================
-- VERIFY  (run after seed to confirm data)
-- =============================================================================
-- \echo '--- Users by role ---'
-- SELECT "Role", COUNT(*) FROM users GROUP BY "Role" ORDER BY "Role";
--
-- \echo '--- Lawyers ---'
-- SELECT u."FullName", u."Email", l."City", l."IsVerified", l."Rating"
--   FROM lawyers l JOIN users u ON u."Id" = l."UserId"
--   ORDER BY l."Rating" DESC;
--
-- \echo '--- Lawyer specializations ---'
-- SELECT u."FullName", string_agg(s."Name", ', ' ORDER BY s."Name") AS specializations
--   FROM lawyer_specializations ls
--   JOIN lawyers l ON l."Id" = ls."LawyerId"
--   JOIN users u ON u."Id" = l."UserId"
--   JOIN "Specializations" s ON s."Id" = ls."SpecializationId"
--   GROUP BY u."FullName"
--   ORDER BY u."FullName";
