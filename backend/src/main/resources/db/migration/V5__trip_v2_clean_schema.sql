-- Replace legacy trip schema pieces with clean v2 structures.
-- No backward compatibility/data migration required for this phase.

ALTER TABLE trips
    RENAME COLUMN user_id TO owner_id;

ALTER TABLE trips
    DROP COLUMN memberships,
    DROP COLUMN invites;

CREATE TABLE trip_memberships (
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (trip_id, user_id),
    CONSTRAINT chk_trip_membership_role CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER'))
);

CREATE INDEX idx_trip_memberships_user_id ON trip_memberships(user_id);
CREATE INDEX idx_trip_memberships_trip_id ON trip_memberships(trip_id);

CREATE TABLE trip_invites (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trip_invites_role CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER')),
    CONSTRAINT chk_trip_invites_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED'))
);

CREATE INDEX idx_trip_invites_trip_id ON trip_invites(trip_id);
CREATE INDEX idx_trip_invites_email ON trip_invites(lower(email));
CREATE UNIQUE INDEX uq_trip_invites_trip_email_ci ON trip_invites (trip_id, lower(email));
