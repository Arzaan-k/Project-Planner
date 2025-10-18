-- Fix existing feature requests with empty/null titles and descriptions
UPDATE feature_requests
SET
  title = COALESCE(NULLIF(TRIM(title), ''), 'Untitled Request'),
  description = COALESCE(NULLIF(TRIM(description), ''), 'No description provided'),
  requested_by_name = COALESCE(NULLIF(TRIM(requested_by_name), ''), 'Unknown'),
  requested_by_email = COALESCE(NULLIF(TRIM(requested_by_email), ''), 'unknown@example.com'),
  business_value = CASE
    WHEN business_value IS NULL OR TRIM(business_value) = '' THEN NULL
    ELSE TRIM(business_value)
  END,
  estimated_hours = CASE
    WHEN estimated_hours IS NULL OR estimated_hours = 0 THEN NULL
    ELSE estimated_hours
  END,
  priority = COALESCE(NULLIF(TRIM(priority), ''), 'medium'),
  stakeholder_type = COALESCE(NULLIF(TRIM(stakeholder_type), ''), 'client'),
  status = COALESCE(NULLIF(TRIM(status), ''), 'pending')
WHERE
  title IS NULL OR TRIM(title) = '' OR
  description IS NULL OR TRIM(description) = '' OR
  requested_by_name IS NULL OR TRIM(requested_by_name) = '' OR
  requested_by_email IS NULL OR TRIM(requested_by_email) = '';

-- Show how many rows were updated
SELECT COUNT(*) as updated_rows FROM feature_requests;
