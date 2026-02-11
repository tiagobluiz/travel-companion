ALTER TABLE trips
    ADD COLUMN visibility VARCHAR(32) NOT NULL DEFAULT 'PRIVATE',
    ADD COLUMN memberships JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN invites JSONB NOT NULL DEFAULT '[]';

-- Backfill existing rows so the legacy owner is represented as an OWNER membership.
UPDATE trips
SET memberships = jsonb_build_array(
    jsonb_build_object(
        'userId', user_id::text,
        'role', 'OWNER'
    )
)
WHERE memberships = '[]'::jsonb;

