-- Add slow_response_threshold_ms to monitors.
-- When set, a successful check whose responseMs exceeds this value is
-- recorded as 'degraded' instead of 'up' and a one-shot slow-response
-- notification is enqueued. NULL = feature disabled for this monitor.

ALTER TABLE monitors
  ADD COLUMN IF NOT EXISTS slow_response_threshold_ms integer;
