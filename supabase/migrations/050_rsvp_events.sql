-- Migration 050: RSVP System for Events
-- Data: 27/02/2026
-- Creates event_rsvps table, summary view, RLS policies, and event capacity columns

-- ═══ TABLE ═══
CREATE TABLE IF NOT EXISTS event_rsvps (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id     uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'CONFIRMED'
               CHECK (status IN ('CONFIRMED', 'PENDING', 'CANCELLED', 'WAITLIST', 'REJECTED')),
  confirmed_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),

  UNIQUE (event_id, user_id)
);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id
  ON event_rsvps(event_id);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id
  ON event_rsvps(user_id);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_confirmed
  ON event_rsvps(event_id, status)
  WHERE status = 'CONFIRMED';

-- ═══ EVENT CAPACITY COLUMNS ═══
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS max_rsvps integer,
  ADD COLUMN IF NOT EXISTS rsvp_deadline timestamptz;

-- ═══ SUMMARY VIEW ═══
CREATE OR REPLACE VIEW event_rsvp_summary AS
SELECT
  e.id          AS event_id,
  e.title       AS event_title,
  e.start_date  AS event_date,
  e.max_rsvps,
  COUNT(r.id) FILTER (WHERE r.status = 'CONFIRMED') AS confirmed_count,
  COUNT(r.id) FILTER (WHERE r.status = 'WAITLIST')  AS waitlist_count,
  CASE
    WHEN e.max_rsvps IS NULL THEN false
    WHEN COUNT(r.id) FILTER (WHERE r.status = 'CONFIRMED') >= e.max_rsvps THEN true
    ELSE false
  END AS is_full
FROM events e
LEFT JOIN event_rsvps r ON r.event_id = e.id
GROUP BY e.id, e.title, e.start_date, e.max_rsvps;

-- ═══ RLS ═══
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- SELECT: own RSVPs + any confirmed (to show attendees list)
CREATE POLICY "rsvp_select" ON event_rsvps
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR status = 'CONFIRMED'
  OR is_admin_or_team()
);

-- INSERT: own RSVP only
CREATE POLICY "rsvp_insert" ON event_rsvps
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: own RSVP or admin
CREATE POLICY "rsvp_update" ON event_rsvps
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR is_admin_or_team()
)
WITH CHECK (
  user_id = auth.uid()
  OR is_admin_or_team()
);

-- DELETE: own RSVP or admin
CREATE POLICY "rsvp_delete" ON event_rsvps
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR is_admin_or_team()
);

-- ═══ GRANTS ═══
GRANT ALL ON event_rsvps TO authenticated;
GRANT SELECT ON event_rsvp_summary TO authenticated;
