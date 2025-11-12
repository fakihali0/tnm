-- Schedule security monitoring to run every 10 minutes
SELECT cron.schedule(
  'monitor-security-events-job',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='https://edzkorfdixvvvrkfzqzg.supabase.co/functions/v1/monitor-security-events',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkemtvcmZkaXh2dnZya2Z6cXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MzMxNTQsImV4cCI6MjA3MzMwOTE1NH0.n4DE8fB_6HrPBvhQkuISPbfHKyvI72QwTSNB3vFCrpQ"}'::jsonb,
    body:=concat('{"timestamp": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);