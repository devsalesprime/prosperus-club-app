-- Migration 072: Add Ticket and Check-in columns to event_rsvps
-- Extends the existing event_rsvps table with ticket generation and check-in status

ALTER TABLE event_rsvps
  ADD COLUMN IF NOT EXISTS ticket_code uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS check_in_status boolean DEFAULT false;

-- Create an index on the new ticket_code for fast lookups by the scanner
CREATE INDEX IF NOT EXISTS idx_event_rsvps_ticket_code
  ON event_rsvps(ticket_code);
