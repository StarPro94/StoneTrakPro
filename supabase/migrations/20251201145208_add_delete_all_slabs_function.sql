/*
  # Add function to delete all slabs for a user

  1. New Function
    - `delete_all_user_slabs(p_user_id uuid)` - Deletes all slabs for a given user
    - Returns the number of deleted slabs
    - Restricted to authenticated users deleting their own slabs only

  2. Purpose
    - Enable testing by allowing users to clear their entire slab park
    - Useful for re-importing fresh data without duplicates
    - Maintains audit trail through existing history triggers

  3. Security
    - Function is SECURITY DEFINER but checks user authentication
    - Users can only delete their own slabs
    - Cascade deletes will handle related records (photos, history)

  4. Usage
    - Can be called from application to implement "Clear Park" feature
    - Recommended to add double confirmation in UI before calling
*/

-- Function to delete all slabs for a user
CREATE OR REPLACE FUNCTION delete_all_user_slabs(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Security check: only allow users to delete their own slabs
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez supprimer que vos propres tranches';
  END IF;

  -- Delete all slabs for this user
  WITH deleted AS (
    DELETE FROM slabs
    WHERE user_id = p_user_id
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'message', format('%s tranche(s) supprimée(s) avec succès', deleted_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION delete_all_user_slabs IS 'Deletes all slabs for the authenticated user. Used for testing and data cleanup. Returns count of deleted slabs.';