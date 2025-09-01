-- Fix security vulnerability: Remove ability for users to view all unused codes
-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Users can view unused codes" ON product_codes;

-- Create secure policy - users can only see codes they have used
CREATE POLICY "Users can view their own used codes"
ON product_codes
FOR SELECT
USING (used_by = auth.uid());

-- Create secure function for code validation and redemption
CREATE OR REPLACE FUNCTION redeem_product_code(code_value_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record product_codes;
  product_record products;
  result JSON;
  user_profile profiles;
BEGIN
  -- Get the current user's profile
  SELECT * INTO user_profile FROM profiles WHERE id = auth.uid();
  
  -- Check if user profile exists
  IF user_profile.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;

  -- Find the code (case insensitive search)
  SELECT * INTO code_record 
  FROM product_codes 
  WHERE UPPER(code_value) = UPPER(code_value_input)
  AND expires_at > NOW();

  -- Check if code exists
  IF code_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired code'
    );
  END IF;

  -- Check if code is already used
  IF code_record.is_used = true THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code has already been used'
    );
  END IF;

  -- Get product information
  SELECT * INTO product_record FROM products WHERE id = code_record.product_id;
  
  IF product_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found'
    );
  END IF;

  -- Mark code as used
  UPDATE product_codes 
  SET 
    is_used = true,
    used_by = auth.uid(),
    used_at = NOW()
  WHERE id = code_record.id;

  -- Add points to user profile
  UPDATE profiles 
  SET points = points + product_record.points_value
  WHERE id = auth.uid();

  -- Record the redemption
  INSERT INTO user_redemptions (user_id, code_id, points_earned)
  VALUES (auth.uid(), code_record.id, product_record.points_value);

  -- Return success with details
  RETURN json_build_object(
    'success', true,
    'points_earned', product_record.points_value,
    'product_name', product_record.name,
    'new_total_points', user_profile.points + product_record.points_value
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'An error occurred while processing the code'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION redeem_product_code(TEXT) TO authenticated;