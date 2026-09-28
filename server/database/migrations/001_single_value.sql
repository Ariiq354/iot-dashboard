-- One-time migration from the original three-metric flow.
-- Reset IoT demo data; authentication tables are preserved.
BEGIN;
TRUNCATE TABLE alert, telemetry, device_threshold, device RESTART IDENTITY;
ALTER TABLE device DROP COLUMN status,
  ADD COLUMN nama_nilai text NOT NULL,
  ADD COLUMN satuan_nilai text NOT NULL;
ALTER TABLE telemetry DROP COLUMN temperature, DROP COLUMN humidity, DROP COLUMN co2,
  ADD COLUMN nilai numeric(10, 2) NOT NULL,
  ADD COLUMN nama_nilai text NOT NULL,
  ADD COLUMN satuan_nilai text NOT NULL;
ALTER TABLE device_threshold DROP CONSTRAINT device_threshold_device_metric_unique,
  DROP COLUMN metric, DROP COLUMN minimum, DROP COLUMN unit,
  ALTER COLUMN maximum SET NOT NULL,
  ADD CONSTRAINT device_threshold_device_unique UNIQUE (device_id);
DROP TYPE device_status;
DROP TYPE threshold_metric;
COMMIT;
