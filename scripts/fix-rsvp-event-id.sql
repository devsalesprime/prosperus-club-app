-- =============================================
-- FIX: event_rsvps.event_id UUID → TEXT
-- =============================================
-- O app usa IDs de evento como strings simples ("1", "2", etc)
-- vindos do mock/localStorage, não UUIDs do Supabase.
-- Precisamos mudar o tipo para TEXT e remover a FK constraint.

-- 1. Drop FK constraint
ALTER TABLE event_rsvps DROP CONSTRAINT IF EXISTS event_rsvps_event_id_fkey;

-- 2. Change column type from UUID to TEXT
ALTER TABLE event_rsvps ALTER COLUMN event_id TYPE TEXT USING event_id::TEXT;

-- 3. Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_rsvps' AND column_name = 'event_id';
