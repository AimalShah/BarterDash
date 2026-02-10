# Whatnot App Agent Skill Guide

## Overview
This Markdown file serves as a comprehensive skill guide for AI agents to understand, simulate, automate, or implement Whatnot-like live shopping app features and flows. Whatnot is a livestream shopping marketplace combining eBay auctions with Twitch-style streaming for categories like collectibles, fashion, sneakers, and more.[web:1][web:2] Key roles include Buyers (browsing/bidding), Sellers (listing/streaming), and Platform Admins. Agents can use this for testing, development, or user support simulations.[web:1]

## In-App Features
Whatnot's core features enable community-driven live sales with real-time interaction.

- **Live Streaming**: Sellers host auctions/shows with video/audio; buyers watch, chat, ask questions.[web:1][web:3]
- **Auctions & Bidding**: Real-time bidding (Sudden Death or Normal with 10s extension); max bid auto-bid.[web:6][web:8]
- **Buy It Now/Flash Sales**: Fixed-price sales or timed deals for quick inventory movement.[web:5][web:15]
- **Product Listings**: Pre-show listings with title, description, category, condition, pricing.[web:5]
- **Seller Dashboard**: Metrics (sales, AOV), inventory management, show scheduling, order/shipping tracking, account health.[web:3][web:10]
- **Buyer Tools**: Rewards program, levels/diamonds for perks (free items), search/follow sellers.[web:15]
- **Chat & Community**: Real-time chat, collaborations, trivia/games during shows.[web:15]
- **Payments & Shipping**: Platform-handled payments (commission-based), seller-shipped with labels.[web:6]
- **Customer Service**: Buyer requests routed to sellers first, then platform escalation.[web:14]

## Authentication Flows
OAuth-based secure login for buyers/sellers; agent tip: simulate with client ID/secret.[web:4]

1. User taps "Sign Up/Login" → Email/phone or social OAuth.
2. Redirect to Whatnot approval screen.
3. Post-approval: Redirect URI with auth code → Exchange for access token.[web:4]
4. Profile setup: Add picture, verify account before onboarding.[web:13]
5. Seller-specific: Waiting list approval → Group onboarding session (live chat, guidelines review).[web:13][web:18]

## Seller Onboarding Flow
New sellers follow structured approval to ensure compliance.[web:13][web:18]

| Step | Action | Details |
|------|--------|---------|
| 1 | Account Creation | Sign up, add profile pic, join waitlist (up to 2 weeks).[web:18] |
| 2 | Approval Notification | Email invite to group onboarding.[web:13] |
| 3 | Onboarding Session | Live session: Review guidelines, shipping, show scheduling.[web:13] |
| 4 | Live Access Granted | Access dashboard, schedule first show.[web:3] |
| 5 | Profile Optimization | Use stories, advertise ethically (no poaching).[web:18] |

## Product Creation Flow
Listings are essential for discoverability; support temp/permanent types.[web:5]

1. Tap "+" or "List Item" in dashboard/app.
2. Select Category (e.g., Funko, Sneakers).
3. Enter Title (keyword-rich), Description (condition details), Photos.
4. Pricing: Buy It Now (fixed) or Auction (start bid, duration).[web:5][web:7]
5. Save as Temp (show-only) or Permanent.
6. Agent Tip: Validate condition per guidelines; optimize for search.[web:5]

## Seller Dashboard & Management
Central hub for operations; desktop/mobile views.[web:3][web:10]

- **Home View**: Upcoming shows, due shipments, CS inquiries, health snapshot.[web:10]
- **Sales Analytics**: Total sales, AOV, customer insights; weekly reports.[web:10]
- **Inventory**: Categorize, quantities, search improvements.[web:3]
- **Scheduling**: Set show time, stream tools, multi-seller collab.[web:3]

## Streaming Flow
Live shows drive engagement; prepare inventory ahead.[web:3][web:6]

1. Schedule show via dashboard.
2. Go live: Showcase items, chat interaction, auctioneer commentary.
3. Run auctions/flash sales: Announce bids, answer Q&A.
4. End show: Auto-notify winners.
5. Post-show: Fulfill orders promptly.[web:6]

## Buying Flow
Buyers spend ~80min/day; focus on discovery and seamless purchase.[web:9]

1. Browse home/feed → Search/follow categories/sellers.
2. Join live show → Watch stream.
3. Interact: Chat, bid (tap amount or max bid).
4. Win/Purchase: Auto-payment process.
5. Track order → Receive shipping updates.[web:6][web:9]

## Auction & Bidding Flow
Core excitement; competitive real-time mechanics.[web:6][web:8]

| Phase | Buyer Action | Seller Action | Platform |
|-------|--------------|---------------|----------|
| Join | Tap listing → Enter live. | Showcase item. | Stream video/chat. |
| Bid | Tap bid increment or set max. | Monitor bids. | Extend timer if <10s (Normal mode). |
| End | Highest wins (Sudden Death or no bids). | Confirm winner. | Notify, charge payment. |
| Post | Track shipment. | Ship w/label. | Handle commission/refunds. |

## Additional Flows
Complete app ecosystem.

### Shipping & Fulfillment
- Sellers select method, print labels via dashboard.
- Share tracking; due dates highlighted.[web:3][web:6]

### Customer Support
- Buyers submit request → Seller resolves → Escalate if needed.[web:14]

### Rewards & Loyalty
- Earn points/levels/diamonds for perks (e.g., free shipping items).[web:15]

### Community & Social
- Follow, stories, collab shows, referrals.[web:18]

### Admin/Platform Flows (Simulated)
- Monitor shows for guidelines.
- Handle disputes, commissions.
- Analytics for trends (e.g., 2026 reports).[web:20]

## Agent Usage Guidelines
- **Simulation**: Follow flows sequentially; use tables for decision branches.
- **Automation**: Prioritize real-time bidding/streaming mocks.
- **Edge Cases**: Handle bid wars, failed payments, shipping delays.
- **Metrics**: Track GMV, engagement (watch time), conversion.[web:9]
- **Best Practices**: Keyword-optimize listings, hype auctions, quick shipping.[web:5][web:18]

This skill is extensible—update with new features like 2026 trends.[web:20]
