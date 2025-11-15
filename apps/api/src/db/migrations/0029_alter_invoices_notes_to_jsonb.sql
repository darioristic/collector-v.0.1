-- Migration: Convert invoices.notes from text to jsonb
-- This migration converts existing text notes to JSON format for Tiptap editor compatibility

-- Step 1: Add a temporary column for jsonb
ALTER TABLE invoices ADD COLUMN notes_jsonb jsonb;

-- Step 2: Convert existing text notes to JSON format
-- Wrap non-empty text in a Tiptap-compatible JSON structure
UPDATE invoices
SET notes_jsonb = CASE
    WHEN notes IS NULL OR notes = '' THEN NULL
    ELSE jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
            jsonb_build_object(
                'type', 'paragraph',
                'content', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'text',
                        'text', notes
                    )
                )
            )
        )
    )
END
WHERE notes IS NOT NULL;

-- Step 3: Drop the old text column
ALTER TABLE invoices DROP COLUMN notes;

-- Step 4: Rename the new column to notes
ALTER TABLE invoices RENAME COLUMN notes_jsonb TO notes;

-- Step 5: Add comment for documentation
COMMENT ON COLUMN invoices.notes IS 'Rich text content stored as Tiptap JSON format';

