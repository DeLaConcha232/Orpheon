-- Add unique hexadecimal code to profiles table
ALTER TABLE public.profiles 
ADD COLUMN hex_code TEXT UNIQUE;

-- Create function to generate unique hexadecimal code
CREATE OR REPLACE FUNCTION public.generate_hex_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    hex_code TEXT;
    code_exists BOOLEAN := TRUE;
BEGIN
    -- Generate unique hex code until we find one that doesn't exist
    WHILE code_exists LOOP
        -- Generate 12 character hexadecimal code (6 bytes = 12 hex chars)
        hex_code := encode(gen_random_bytes(6), 'hex');
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE hex_code = hex_code) INTO code_exists;
    END LOOP;
    
    RETURN hex_code;
END;
$$;

-- Update existing profiles to have hex codes
UPDATE public.profiles 
SET hex_code = public.generate_hex_code() 
WHERE hex_code IS NULL;

-- Make hex_code NOT NULL after setting values
ALTER TABLE public.profiles 
ALTER COLUMN hex_code SET NOT NULL;

-- Update the handle_new_user function to generate hex_code for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, hex_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    public.generate_hex_code()
  );
  RETURN NEW;
END;
$$;