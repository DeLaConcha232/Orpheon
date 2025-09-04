-- Phase 1: Critical Security Fixes

-- 1. Fix Product Code RLS Policy - Remove dangerous UPDATE policy
DROP POLICY IF EXISTS "Users can update codes they're redeeming" ON public.product_codes;

-- 2. Create secure audit log table for tracking redemption attempts
CREATE TABLE public.redemption_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  code_value TEXT NOT NULL,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('success', 'invalid_code', 'already_used', 'expired', 'rate_limited', 'suspicious')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.redemption_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own attempts, admins can view all
CREATE POLICY "Users can view own redemption attempts" 
  ON public.redemption_attempts 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 3. Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_redemption_rate_limit(user_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count attempts in the last hour
  SELECT COUNT(*) INTO attempt_count
  FROM public.redemption_attempts
  WHERE user_id = user_id_input 
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Allow max 10 attempts per hour
  RETURN attempt_count < 10;
END;
$$;

-- 4. Enhanced redeem_product_code function with security improvements
CREATE OR REPLACE FUNCTION public.redeem_product_code(code_value_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code_record product_codes;
  product_record products;
  result JSON;
  user_profile profiles;
  rate_limit_ok BOOLEAN;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user profile exists
  SELECT * INTO user_profile FROM profiles WHERE id = current_user_id;
  
  IF user_profile.id IS NULL THEN
    -- Log failed attempt
    INSERT INTO public.redemption_attempts (user_id, code_value, attempt_type)
    VALUES (current_user_id, code_value_input, 'invalid_user');
    
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;

  -- Check rate limiting
  SELECT public.check_redemption_rate_limit(current_user_id) INTO rate_limit_ok;
  
  IF NOT rate_limit_ok THEN
    -- Log rate limited attempt
    INSERT INTO public.redemption_attempts (user_id, code_value, attempt_type)
    VALUES (current_user_id, code_value_input, 'rate_limited');
    
    RETURN json_build_object(
      'success', false,
      'error', 'Too many redemption attempts. Please wait before trying again.'
    );
  END IF;

  -- Validate code format (basic validation)
  IF LENGTH(code_value_input) < 5 OR code_value_input !~ '^[A-Z0-9\-]+$' THEN
    -- Log invalid format attempt
    INSERT INTO public.redemption_attempts (user_id, code_value, attempt_type)
    VALUES (current_user_id, code_value_input, 'invalid_format');
    
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid code format'
    );
  END IF;

  -- Find the code (case insensitive search)
  SELECT * INTO code_record 
  FROM product_codes 
  WHERE UPPER(code_value) = UPPER(code_value_input)
  AND expires_at > NOW();

  -- Check if code exists
  IF code_record.id IS NULL THEN
    -- Log invalid code attempt
    INSERT INTO public.redemption_attempts (user_id, code_value, attempt_type)
    VALUES (current_user_id, code_value_input, 'invalid_code');
    
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired code'
    );
  END IF;

  -- Check if code is already used
  IF code_record.is_used = true THEN
    -- Log already used attempt
    INSERT INTO public.redemption_attempts (user_id, code_value, attempt_type)
    VALUES (current_user_id, code_value_input, 'already_used');
    
    RETURN json_build_object(
      'success', false,
      'error', 'Code has already been used'
    );
  END IF;

  -- Get product information
  SELECT * INTO product_record FROM products WHERE id = code_record.product_id;
  
  IF product_record.id IS NULL THEN
    -- Log invalid product attempt
    INSERT INTO public.redemption_attempts (user_id, code_value, attempt_type)
    VALUES (current_user_id, code_value_input, 'invalid_product');
    
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found'
    );
  END IF;

  -- Mark code as used (this is the ONLY way codes should be updated)
  UPDATE product_codes 
  SET 
    is_used = true,
    used_by = current_user_id,
    used_at = NOW()
  WHERE id = code_record.id;

  -- Add points to user profile
  UPDATE profiles 
  SET points = points + product_record.points_value
  WHERE id = current_user_id;

  -- Record the redemption
  INSERT INTO user_redemptions (user_id, code_id, points_earned)
  VALUES (current_user_id, code_record.id, product_record.points_value);

  -- Log successful redemption
  INSERT INTO public.redemption_attempts (user_id, code_value, attempt_type)
  VALUES (current_user_id, code_value_input, 'success');

  -- Return success with details
  RETURN json_build_object(
    'success', true,
    'points_earned', product_record.points_value,
    'product_name', product_record.name,
    'new_total_points', user_profile.points + product_record.points_value
  );

EXCEPTION WHEN OTHERS THEN
  -- Log system error
  INSERT INTO public.redemption_attempts (user_id, code_value, attempt_type)
  VALUES (current_user_id, code_value_input, 'system_error');
  
  RETURN json_build_object(
    'success', false,
    'error', 'An error occurred while processing the code'
  );
END;
$$;

-- 5. Create function to detect suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(user_id_input UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_failures INTEGER;
  rapid_attempts INTEGER;
BEGIN
  -- Count failed attempts in last 10 minutes
  SELECT COUNT(*) INTO recent_failures
  FROM public.redemption_attempts
  WHERE user_id = user_id_input 
    AND attempt_type IN ('invalid_code', 'already_used')
    AND created_at > NOW() - INTERVAL '10 minutes';
  
  -- Count rapid attempts (more than 5 in 1 minute)
  SELECT COUNT(*) INTO rapid_attempts
  FROM public.redemption_attempts
  WHERE user_id = user_id_input 
    AND created_at > NOW() - INTERVAL '1 minute';
  
  -- Flag as suspicious if more than 5 failures in 10 minutes or more than 5 attempts in 1 minute
  RETURN (recent_failures > 5 OR rapid_attempts > 5);
END;
$$;