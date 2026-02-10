-- Migration to fix place_bid_atomic function to use correct table schema
-- The function was using 'live_auctions' table but the app uses 'auctions' table

CREATE OR REPLACE FUNCTION public.place_bid_atomic(
  p_auction_id UUID,
  p_user_id UUID,
  p_amount DECIMAL
)
RETURNS JSON AS $$
DECLARE
  v_current_bid DECIMAL;
  v_starting_bid DECIMAL;
  v_minimum_bid_increment DECIMAL;
  v_auction_status TEXT;
  v_ends_at TIMESTAMPTZ;
  v_new_bid_id UUID;
  v_previous_high_bidder UUID;
  v_bid_count INT;
BEGIN
  -- 1. Lock auction row and get current state
  SELECT current_bid, starting_bid, minimum_bid_increment, status, ends_at, bid_count
  INTO v_current_bid, v_starting_bid, v_minimum_bid_increment, v_auction_status, v_ends_at, v_bid_count
  FROM public.auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  -- 2. Validate state
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auction with id % not found', p_auction_id;
  END IF;

  IF v_auction_status NOT IN ('active', 'live') THEN
    RAISE EXCEPTION 'Auction is not live';
  END IF;

  IF v_ends_at < NOW() THEN
    RAISE EXCEPTION 'Auction has ended';
  END IF;

  -- 3. Validate bid amount
  DECLARE
    v_minimum_bid DECIMAL;
  BEGIN
    v_minimum_bid := COALESCE(v_current_bid, v_starting_bid, 0) + COALESCE(v_minimum_bid_increment, 1);
    IF p_amount < v_minimum_bid THEN
      RAISE EXCEPTION 'Bid must be at least %', v_minimum_bid;
    END IF;
  END;

  -- 4. Get previous high bidder (for notifications if needed)
  SELECT bidder_id INTO v_previous_high_bidder
  FROM public.bids
  WHERE auction_id = p_auction_id
  ORDER BY amount DESC, created_at DESC
  LIMIT 1;

  -- 5. Mark all previous bids as not winning
  UPDATE public.bids
  SET is_winning = false
  WHERE auction_id = p_auction_id;

  -- 6. Insert new bid
  INSERT INTO public.bids (auction_id, bidder_id, amount, is_winning)
  VALUES (p_auction_id, p_user_id, p_amount::text, true)
  RETURNING id INTO v_new_bid_id;

  -- 7. Update auction with new bid info
  UPDATE public.auctions
  SET 
    current_bid = p_amount::text,
    current_bidder_id = p_user_id,
    bid_count = v_bid_count + 1,
    updated_at = NOW()
  WHERE id = p_auction_id;

  -- 8. Return success object
  RETURN json_build_object(
    'bid_id', v_new_bid_id,
    'new_price', p_amount,
    'previous_bidder', v_previous_high_bidder,
    'time_remaining', EXTRACT(EPOCH FROM (v_ends_at - NOW())),
    'bid_count', v_bid_count + 1
  );
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION public.place_bid_atomic IS 'Atomically places a bid on an auction. Uses the correct auctions table schema.';
