CREATE TABLE IF NOT EXISTS hubspot_directory (
  hubspot_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  app_profile_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE member_deals ALTER COLUMN buyer_id DROP NOT NULL;
ALTER TABLE member_deals ADD COLUMN IF NOT EXISTS hubspot_buyer_id TEXT REFERENCES hubspot_directory(hubspot_id);

ALTER TABLE member_referrals ALTER COLUMN receiver_id DROP NOT NULL;
ALTER TABLE member_referrals ADD COLUMN IF NOT EXISTS hubspot_receiver_id TEXT REFERENCES hubspot_directory(hubspot_id);