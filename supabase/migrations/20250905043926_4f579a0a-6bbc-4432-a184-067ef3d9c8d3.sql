-- Add unique hexadecimal code to profiles table
ALTER TABLE public.profiles 
ADD COLUMN hex_code TEXT UNIQUE;

-- Create function to generate unique hexadecimal code using md5 and random
CREATE OR REPLACE FUNCTION public.generate_hex_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    generated_hex TEXT;
    code_exists BOOLEAN := TRUE;
BEGIN
    -- Generate unique hex code until we find one that doesn't exist
    WHILE code_exists LOOP
        -- Generate 12 character hexadecimal code using md5 and random
        generated_hex := substring(md5(random()::text || clock_timestamp()::text) from 1 for 12);
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE hex_code = generated_hex) INTO code_exists;
    END LOOP;
    
    RETURN UPPER(generated_hex);
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