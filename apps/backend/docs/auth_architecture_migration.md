# Auth Architecture Migration Analysis

## Overview
You are proposing a shift from a **Server-Side Proxy Auth** architecture to a **Client-Side Direct Auth** architecture using Supabase. This document compares the two approaches, validates your reasoning, and outlines the implementation strategy for additional features.

## Architecture Comparison

### 1. Current Architecture (Server-Side Proxy)
*   **Flow:** React Native App $\rightarrow$ NestJS API (`/auth/login`) $\rightarrow$ Supabase Auth.
*   **Pros:**
    *   Centralized control over the authentication process.
    *   Ability to add custom validation middleware before hitting Supabase.
*   **Cons:**
    *   **Double Hop:** Requests go through an extra layer (App -> API -> Supabase), increasing latency.
    *   **Complexity:** Handling social login (Google OAuth) is complex because redirects must be managed between the mobile app, the backend, and Supabase.
    *   **State Management:** The backend has to manage sessions or proxy tokens back and forth.

### 2. Proposed Architecture (Client-Side Direct)
*   **Flow:** React Native App $\rightarrow$ Supabase Auth (Directly).
*   **Authenticated Requests:** React Native App $\rightarrow$ NestJS API (with Bearer Token).
*   **Pros:**
    *   **Simpler Social Auth:** Supabase SDKs for React Native handle OAuth flows (deep linking) out of the box.
    *   **Performance:** Auth requests go directly to the auth provider.
    *   **Feature Rich:** Easier usage of "Change Password", "Magic Links", and "MFA" directly from the client SDK.
*   **Cons:**
    *   **Trust:** You must ensure your backend strictly validates the JWT token for every request.
    *   **Profile Sync:** You need to manually ensure a User Profile is created in your backend database after the user signs up on Supabase.

### Verdict
**Your thinking is correct.**
For a setup with **Expo React Native + Supabase + NestJS**, the **Client-Side Direct** approach is the industry standard. It significantly simplifies the complex flows of mobile authentication (especially deep linking for OAuth and Email logic).

---

## Implementation Strategy

### 1. Authentication Flow
1.  **Client (Expo):** User fills out Login/Register form.
2.  **Client (Expo):** Call `supabase.auth.signUp()` or `supabase.auth.signInWithPassword()`.
3.  **Supabase:** Returns a `session` object containing the `access_token` (JWT) and `user` details.
4.  **Client (Expo):** Stores the session securely (e.g., `SecureStore`).
5.  **Client (Expo) $\rightarrow$ Backend:**
    *   **Trigger:** On successful registration *only*.
    *   **Action:** Call `POST /users/profile` (or a dedicated `sync` endpoint) with the `access_token` in the header and profile data (username, full name) in the body.
    *   **Backend:** Decodes token, verifies identity, and inserts row into `profiles` table if it doesn't exist.

### 2. Forgot & Change Password
Since Supabase is handling auth, these features are implemented strictly on the **Client Side**:

*   **Forgot Password:**
    *   **Client:** Call `supabase.auth.resetPasswordForEmail(email)`.
    *   **Supabase:** Sends an email with a redirect link.
    *   **Config:** You must configure the "Site URL" and "Redirect URLs" in Supabase Dashboard to point back to your Expo app (e.g., `exp://...` or `myapp://reset-password`).
    *   **App Handling:** The app catches the deep link, detects the `type=recovery` fragment, and directs the user to a "Set New Password" screen.

*   **Change Password:**
    *   **Client (Authenticated):** Call `supabase.auth.updateUser({ password: newPassword })`.
    *   **Requirement:** The user must already be logged in to do this.

### 3. Email Verification
*   **Setup:** Enable "Enable Email Confirmations" in Supabase Dashboard -> Auth -> Providers -> Email.
*   **Flow:**
    1.  User signs up.
    2.  Supabase sends a "Confirm your email" link.
    3.  User clicks link -> App opens via Deep Link.
    4.  Supabase SDK detects the link and verifies the session automatically.
*   **Backend Protection:** Your NestJS guards should check the `email_verified` claim in the JWT if you want to restrict unverified users.

---

## Required Changes Checklist

### Frontend (Expo)
- [ ] Install `@supabase/supabase-js`.
- [ ] Implement `AuthContext` to manage session state.
- [ ] Configure Deep Linking (in `app.json` and Supabase Dashboard) for OAuth/Email redirects.
- [ ] Create `ForgotPasswordScreen` and `ResetPasswordScreen`.

### Backend (NestJS)
- [ ] **AuthModule:** Remove `AuthService.register` and `AuthService.login` (proxy logic).
- [ ] **Profile Endpoint:** Ensure functionality of `POST /users/profile` or `POST /auth/sync-profile` to create user records.
- [ ] **Guards:** Ensure `JwtAuthGuard` validates the token against Supabase's signing secret.
