-- Backfill latitude and longitude for existing itinerary items that don't have them.
-- Uses 0, 0 as placeholder; items should be updated with correct coordinates.
UPDATE trips
SET itinerary_items = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'latitude' AND elem ? 'longitude' THEN elem
      ELSE elem || '{"latitude": 0, "longitude": 0}'::jsonb
    END
  )
  FROM jsonb_array_elements(itinerary_items) AS elem
)
WHERE itinerary_items != '[]'::jsonb
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(itinerary_items) elem
    WHERE NOT (elem ? 'latitude' AND elem ? 'longitude')
  );
