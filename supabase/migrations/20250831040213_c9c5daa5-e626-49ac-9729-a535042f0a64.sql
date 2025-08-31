-- Create the profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  points INTEGER DEFAULT 0,
  qr_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('gomitas', 'galletas', 'cremas')),
  points_value INTEGER NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product codes table
CREATE TABLE public.product_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_value TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  is_used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 months')
);

-- Create user redemptions table
CREATE TABLE public.user_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  code_id UUID REFERENCES public.product_codes(id),
  points_earned INTEGER,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create redeemed rewards table
CREATE TABLE public.redeemed_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  reward_type TEXT,
  points_cost INTEGER,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending'
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for products (public read)
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (is_active = true);

-- RLS Policies for product_codes
CREATE POLICY "Users can view unused codes" ON public.product_codes FOR SELECT USING (is_used = false OR used_by = auth.uid());
CREATE POLICY "Users can update codes they're redeeming" ON public.product_codes FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for user_redemptions
CREATE POLICY "Users can view own redemptions" ON public.user_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own redemptions" ON public.user_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for redeemed_rewards
CREATE POLICY "Users can view own rewards" ON public.redeemed_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rewards" ON public.redeemed_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample products
INSERT INTO public.products (name, description, category, points_value, image_url) VALUES
('Gomitas Gourmet de Fresa', 'Deliciosas gomitas artesanales con sabor a fresa natural', 'gomitas', 50, '/api/placeholder/300/200'),
('Galletas de Chispas Premium', 'Galletas horneadas con chispas de chocolate belga', 'galletas', 75, '/api/placeholder/300/200'),
('Crema de Cacahuate Artesanal', 'Crema cremosa hecha con cacahuates seleccionados', 'cremas', 100, '/api/placeholder/300/200'),
('Gomitas de Mango', 'Gomitas tropicales con auténtico sabor a mango', 'gomitas', 50, '/api/placeholder/300/200'),
('Galletas de Avena y Miel', 'Galletas nutritivas con avena integral y miel pura', 'galletas', 60, '/api/placeholder/300/200');

-- Insert sample product codes for testing
INSERT INTO public.product_codes (code_value, product_id) 
SELECT 
  'CODE-' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0'),
  (SELECT id FROM public.products ORDER BY RANDOM() LIMIT 1)
FROM generate_series(1, 50);