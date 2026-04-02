-- Migration 073: Create event_tickets relational table (QR Code V2)
-- Supports: Multi-day tickets, Guest tickets, scalable architecture
-- Replaces the flat ticket_code/check_in_status on event_rsvps

-- ═══════════════════════════════════════════════════════════════
-- 1. CREATE THE NEW TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS event_tickets (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rsvp_id       uuid NOT NULL REFERENCES event_rsvps(id) ON DELETE CASCADE,
    event_id      uuid NOT NULL,
    owner_type    text NOT NULL DEFAULT 'MEMBER' CHECK (owner_type IN ('MEMBER', 'GUEST')),
    owner_name    text NOT NULL DEFAULT '',
    event_date    date NOT NULL,
    ticket_code   uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    check_in_status boolean NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_tickets_ticket_code ON event_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_event_tickets_rsvp_id ON event_tickets(rsvp_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_date ON event_tickets(event_date);

-- ═══════════════════════════════════════════════════════════════
-- 2. MIGRATE EXISTING DATA (ticket_code from event_rsvps → event_tickets)
-- ═══════════════════════════════════════════════════════════════
-- Preserves all existing tickets (V1) as MEMBER tickets for day 1

INSERT INTO event_tickets (rsvp_id, event_id, owner_type, owner_name, event_date, ticket_code, check_in_status)
SELECT
    r.id AS rsvp_id,
    r.event_id,
    'MEMBER' AS owner_type,
    COALESCE(p.name, '') AS owner_name,
    COALESCE(e.date::date, CURRENT_DATE) AS event_date,
    r.ticket_code,
    COALESCE(r.check_in_status, false)
FROM event_rsvps r
LEFT JOIN profiles p ON p.id = r.user_id
LEFT JOIN club_events e ON e.id = r.event_id
WHERE r.ticket_code IS NOT NULL
  AND r.status = 'CONFIRMED'
  AND NOT EXISTS (
      SELECT 1 FROM event_tickets et WHERE et.ticket_code = r.ticket_code
  );

-- ═══════════════════════════════════════════════════════════════
-- 3. RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

-- Members can read their own tickets (via RSVP ownership)
CREATE POLICY "Users can view own tickets"
    ON event_tickets FOR SELECT
    USING (
        rsvp_id IN (
            SELECT id FROM event_rsvps WHERE user_id = auth.uid()
        )
    );

-- Members can create tickets for their own RSVPs
CREATE POLICY "Users can insert own tickets"
    ON event_tickets FOR INSERT
    WITH CHECK (
        rsvp_id IN (
            SELECT id FROM event_rsvps WHERE user_id = auth.uid()
        )
    );

-- Members can update their own tickets
CREATE POLICY "Users can update own tickets"
    ON event_tickets FOR UPDATE
    USING (
        rsvp_id IN (
            SELECT id FROM event_rsvps WHERE user_id = auth.uid()
        )
    );

-- Admins can read/write all tickets
CREATE POLICY "Admins full access to tickets"
    ON event_tickets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Service role can do everything (for scanner/check-in operations)
CREATE POLICY "Service role full access"
    ON event_tickets FOR ALL
    USING (auth.role() = 'service_role');
