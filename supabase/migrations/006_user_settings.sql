CREATE TABLE IF NOT EXISTS user_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- notifications
  trip_reminders        BOOLEAN NOT NULL DEFAULT true,
  checklist_reminders   BOOLEAN NOT NULL DEFAULT true,
  budget_alerts         BOOLEAN NOT NULL DEFAULT true,
  journal_reminders     BOOLEAN NOT NULL DEFAULT false,
  email_notifications   BOOLEAN NOT NULL DEFAULT true,
  push_notifications    BOOLEAN NOT NULL DEFAULT false,

  -- appearance
  theme             TEXT NOT NULL DEFAULT 'system',
  accent_color      TEXT NOT NULL DEFAULT 'indigo',
  compact_mode      BOOLEAN NOT NULL DEFAULT false,
  animations_enabled BOOLEAN NOT NULL DEFAULT true,

  -- language & region
  language  TEXT NOT NULL DEFAULT 'en',
  timezone  TEXT NOT NULL DEFAULT 'UTC',
  currency  TEXT NOT NULL DEFAULT 'USD',

  -- privacy
  private_account BOOLEAN NOT NULL DEFAULT false,
  hide_profile    BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
