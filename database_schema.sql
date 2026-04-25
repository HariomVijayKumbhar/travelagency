
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,                      
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
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

