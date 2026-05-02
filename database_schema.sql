
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,                      
    created_at TIMESTAMPTZ DEFAULT NOW(),     
    name TEXT NOT NULL,                       
    email TEXT NOT NULL,                      
    package TEXT NOT NULL,                     
    travelers INTEGER NOT NULL DEFAULT 1,      
    total TEXT NOT NULL,                       
    date TEXT NOT NULL,                       
    status TEXT NOT NULL DEFAULT 'Pending',    
    user_email TEXT,                           
    payment_id TEXT,                           
    method TEXT                                
);


ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Enable insert access for all" 
ON public.bookings FOR INSERT 
WITH CHECK (true);


CREATE POLICY "Enable read access for all" 
ON public.bookings FOR SELECT 
USING (true);


CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (true);


CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    duration INTEGER NOT NULL,
    images TEXT[],
    highlights TEXT[],
    best_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for packages" 
ON public.packages FOR SELECT USING (true);

CREATE POLICY "Enable insert access for packages" 
ON public.packages FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for packages" 
ON public.packages FOR UPDATE USING (true);


CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT REFERENCES public.bookings ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    destination TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for reviews" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Enable insert access for reviews" 
ON public.reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for reviews" 
ON public.reviews FOR UPDATE USING (true);

