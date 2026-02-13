CREATE OR REPLACE VIEW `veripura-connect-live.analytics.latest_consignments` AS
SELECT
  * EXCEPT(rn)
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER(PARTITION BY document_id ORDER BY timestamp DESC) as rn
  FROM `veripura-connect-live.analytics.consignments_raw_changelog`
)
WHERE rn = 1 AND operation != 'DELETE'
