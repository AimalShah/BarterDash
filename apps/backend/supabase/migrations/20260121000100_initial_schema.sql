-- migration: 20260121000100_initial_schema.sql

-- Enable UUID extension if not enabled (Supabase usually has it)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('USER', 'SELLER', 'ADMIN')) DEFAULT 'USER',
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sellers Table
CREATE TABLE public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  description TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 10.0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  stripe_connect_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auction Items Table
CREATE TABLE public.auction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starting_price DECIMAL(12,2) NOT NULL CHECK (starting_price > 0),
  buyout_price DECIMAL(12,2),
  images TEXT[],
  category TEXT,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'live', 'ended', 'cancelled')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Live Auctions Table (The active bidding phase)
CREATE TABLE public.live_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.auction_items(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.sellers(id),
  stream_key TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  current_price DECIMAL(12,2),
  bid_increment DECIMAL(12,2) DEFAULT 1.0,
  extension_seconds INT DEFAULT 30,
  viewer_count INT DEFAULT 0,
  status TEXT CHECK (status IN ('scheduled', 'live', 'ended')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bids Table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.live_auctions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  is_autobid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for Performance
CREATE INDEX idx_auctions_status ON public.auction_items(status);
CREATE INDEX idx_live_auctions_end_time ON public.live_auctions(end_time) WHERE status = 'live';
CREATE INDEX idx_bids_auction_time ON public.bids(auction_id, created_at DESC);
CREATE INDEX idx_bids_user ON public.bids(user_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies (Simplified for Initial Setup)

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Sellers
CREATE POLICY "Anyone can view sellers" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "Sellers can update own profile" ON public.sellers FOR UPDATE USING (auth.uid() = user_id);

-- Auction Items
CREATE POLICY "Anyone can view non-draft auctions" ON public.auction_items FOR SELECT USING (status != 'draft');
CREATE POLICY "Sellers can manage own draft auctions" ON public.auction_items 
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.sellers WHERE id = seller_id));

-- Live Auctions
CREATE POLICY "Anyone can view live auctions" ON public.live_auctions FOR SELECT USING (true);

-- Bids
CREATE POLICY "Anyone can view bids" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Users can place bids" ON public.bids FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Atomic Bid Function (RPC)
CREATE OR REPLACE FUNCTION public.place_bid_atomic(
  p_auction_id UUID,
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS JSON AS $$
DECLARE
  v_current_price DECIMAL;
  v_bid_increment DECIMAL;
  v_auction_status TEXT;
  v_end_time TIMESTAMPTZ;
  v_new_bid_id UUID;
  v_previous_high_bidder UUID;
BEGIN
  -- 1. Lock auction row and get current state
  SELECT current_price, bid_increment, status, end_time
  INTO v_current_price, v_bid_increment, v_auction_status, v_end_time
  FROM public.live_auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  -- 2. Validate state
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  IF v_auction_status != 'live' THEN
    RAISE EXCEPTION 'Auction is not live';
  END IF;

  IF v_end_time < NOW() THEN
    RAISE EXCEPTION 'Auction has ended';
  END IF;

  -- 3. Validate bid amount
  IF p_amount < (v_current_price + v_bid_increment) THEN
    RAISE EXCEPTION 'Bid must be at least %', (v_current_price + v_bid_increment);
  END IF;

  -- 4. Get previous high bidder (for notifications if needed)
  SELECT user_id INTO v_previous_high_bidder
  FROM public.bids
  WHERE auction_id = p_auction_id
  ORDER BY amount DESC, created_at DESC
  LIMIT 1;

  -- 5. Insert new bid
  INSERT INTO public.bids (auction_id, user_id, amount)
  VALUES (p_auction_id, p_user_id, p_amount)
  RETURNING id INTO v_new_bid_id;

  -- 6. Update current price in live auction
  UPDATE public.live_auctions
  SET current_price = p_amount
  WHERE id = p_auction_id;

  -- 7. Return success object
  RETURN json_build_object(
    'bid_id', v_new_bid_id,
    'new_price', p_amount,
    'previous_bidder', v_previous_high_bidder,
    'time_remaining', EXTRACT(EPOCH FROM (v_end_time - NOW()))
  );
END;
$$ LANGUAGE plpgsql;
