-- Migration: Add 24-hour image lifecycle with automatic expiry
-- Description: Adds expires_at column to images table for automatic cleanup
-- Created: 2025-10-07

-- Add the expires_at column to the images table
ALTER TABLE public.images
ADD COLUMN expires_at TIMESTAMPTZ;

-- Add a comment to describe the new column's purpose
COMMENT ON COLUMN public.images.expires_at IS 'Timestamp when the image is scheduled for automatic deletion. NULL means the image is saved permanently.';

-- Backfill the expires_at value for all existing images
-- Sets expiry to 24 hours after the image was created
UPDATE public.images
SET expires_at = created_at + INTERVAL '24 hours'
WHERE expires_at IS NULL;

-- Set a default value for the expires_at column for all new rows
-- This ensures new images automatically get an expiry date
ALTER TABLE public.images
ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');

-- Create an index on the expires_at column to speed up cleanup queries
CREATE INDEX IF NOT EXISTS idx_images_expires_at ON public.images(expires_at);

-- Create a database function to clean up expired images
CREATE OR REPLACE FUNCTION cleanup_expired_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired images from the database
  -- Note: Storage cleanup will be handled separately
  WITH deleted AS (
    DELETE FROM public.images
    WHERE expires_at IS NOT NULL
      AND expires_at <= NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment to the cleanup function
COMMENT ON FUNCTION cleanup_expired_images() IS 'Deletes all images where expires_at has passed. Returns the count of deleted images.';
