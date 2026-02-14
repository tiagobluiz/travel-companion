ALTER TABLE trip_invites
DROP CONSTRAINT IF EXISTS chk_trip_invites_status;

ALTER TABLE trip_invites
ADD CONSTRAINT chk_trip_invites_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED'));
