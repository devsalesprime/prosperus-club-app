-- Migration 055: Add CONTESTED to referral_status enum
-- The code uses 'CONTESTED' but the enum only had: NEW, IN_PROGRESS, CONVERTED, LOST
-- This caused: 400 Bad Request: invalid input value for enum referral_status: "CONTESTED"

ALTER TYPE referral_status ADD VALUE IF NOT EXISTS 'CONTESTED';

COMMENT ON TYPE referral_status IS 'Referral statuses: NEW, IN_PROGRESS, CONVERTED, LOST, CONTESTED';
