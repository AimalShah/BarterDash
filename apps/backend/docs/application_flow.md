arterDash Application Flows
This guide explains exactly how data and actions move through the BarterDash ecosystem.

🔑 1. Authentication & Profile Sync
When a user signs up or logs in, we ensure their identity is safe and their profile is ready for bidding.

Supabase DB
Backend
Supabase Auth
Mobile
Supabase DB
Backend
Supabase Auth
Mobile
1. Sign up/Login with Email/Pass
2. Return Session & JWT Token
3. Sync Profile (POST /auth/sync) + JWT
4. Verify JWT with Supabase Strategy
5. Create/Update Profile in Postgres
6. Profile Saved
7. Sync Complete (User is ready)
🔴 2. Seller "Go Live" Flow
This flow starts the immersive experience and schedules the "end timer."

Mobile (All)
Supabase DB
Redis (BullMQ)
Backend
Mobile (Seller)
Mobile (All)
Supabase DB
Redis (BullMQ)
Backend
Mobile (Seller)
1. Go Live Request (POST /auctions/go-live)
2. Set Auction status to 'live'
3. Schedule "End Auction" Job (e.g., in 60 mins)
4. Return Live Session (Stream Key)
5. [REALTIME] Broadcast 'Auction Live' event
⚡ 3. Real-time Bidding Flow
This is the heart of the app. It must be fast and 100% accurate.

All Observers
Supabase DB
Backend
Mobile (Buyer)
All Observers
Supabase DB
Backend
Mobile (Buyer)
1. Place Bid (POST /bids) + JWT
2. Validate (Enough money? Auction alive?)
3. Atomic Update current_price + INSERT bid
4. Success
5. Bid Confirmed
6. [REALTIME] Broadcast new price to everyone
🏁 4. Auction End & Order Creation
What happens when the timer runs out.

Job Trigger: The BullMQ job we scheduled in Step 2 wakes up in Redis.
Logic Execution: The AuctionProcessor in the backend runs:
Finds the highest bid for that auction.
Changes the auction status to ended.
Creates a new Order record in the database.
Winner Notification:
The database broadcasts the status: ended change via Supabase Realtime.
The backend triggers a Push Notification to the winner: "You won! Pay now."
Payment: The winner goes to the "Orders" tab and completes the Stripe payment.
💡 Key Takeaway
The Backend is the "Referee": It validates the rules and manages the clock.
Supabase is the "Messenger": It tells everyone exactly what the Referee decided, instantly.
The Mobile App is the "Stage": It shows the action to the users.