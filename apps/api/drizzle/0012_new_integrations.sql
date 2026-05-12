-- Add PagerDuty, Microsoft Teams, and Telegram webhook fields to organizations
ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "pagerduty_integration_key" varchar(255),
  ADD COLUMN IF NOT EXISTS "teams_webhook_url" varchar(2048),
  ADD COLUMN IF NOT EXISTS "telegram_bot_token" varchar(255),
  ADD COLUMN IF NOT EXISTS "telegram_chat_id" varchar(100);
