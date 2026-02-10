# Full Authentication Guide: Integrating Google OAuth in NestJS with Supabase and TypeORM

## Introduction

In modern web applications, integrating social login providers like Google OAuth enhances user experience by simplifying authentication while maintaining security. This guide focuses on backend implementation in a NestJS application using Supabase for authentication and database management, paired with TypeORM for entity handling. Building on the existing BarterDash backend— which already leverages Supabase for email/password auth and PostgreSQL via TypeORM—this integration extends the AuthModule to support Google login. Users can sign in via Google, with automatic Profile creation or linking in the database. This approach ensures seamless user management without disrupting current flows, such as seller or auction features.

The integration involves Supabase's `signInWithOAuth` method for OAuth initiation, a callback handler for session verification, and TypeORM operations to manage Profile entities. By the end, developers will have a robust, scalable auth system. This guide assumes familiarity with NestJS but provides code examples tied to the codebase (e.g., referencing `src/modules/auth/auth.service.ts`).

## Prerequisites

Before starting, ensure your environment meets these requirements:
- **NestJS Setup:** Version 11+ with @nestjs/common, @nestjs/core, and TypeORM configured (as in `src/app.module.ts`).
- **Supabase:** Project initialized with @supabase/supabase-js (v2.91.0) in `package.json`. Database URL and keys in `.env`.
- **Google Cloud Console:** Create an OAuth 2.0 client ID. Note the client ID and secret for Supabase configuration.
- **Dependencies:** No new packages needed beyond existing ones (e.g., class-validator for DTOs).
- **Environment Variables:** Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env` file, alongside existing Supabase vars.

If not set up, refer to `README.md` for Supabase initialization.

## Supabase Configuration for Google OAuth

Supabase simplifies OAuth by handling providers like Google. In your Supabase dashboard:
1. Navigate to Authentication > Providers > Google.
2. Enable Google and input the client ID/secret from Google Cloud Console.
3. Set authorized redirect URIs (e.g., `http://localhost:3000/api/v1/auth/google/callback` for local dev; update for production).
4. Optionally, configure scopes (default includes email and profile).

Test the setup by running `supabase auth providers list` via CLI. Ensure CORS allows your frontend origins in NestJS (`src/main.ts`).

## Backend Implementation

### Step 1: Update AuthController

Add endpoints to the AuthController (`src/modules/auth/auth.controller.ts`) for initiating and handling Google login.

```typescript
@Post('google')
async loginGoogle(@Body() { redirectTo }: { redirectTo: string }) {
  const { data, error } = await this.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new BadRequestException(error.message);
  return { url: data.url }; // Redirect user to this URL
}

@Get('google/callback')
async googleCallback(@Query('code') code: string, @Query('state') state: string) {
  // Supabase handles the code; extract session
  const { data: { session }, error } = await this.supabase.auth.getSession();
  if (error || !session) throw new UnauthorizedException('OAuth failed');
  
  // Delegate to service for profile handling
  return this.authService.handleGoogleLogin(session.user);
}
```

This mirrors existing auth endpoints but uses OAuth. The callback verifies the session via Supabase.

### Step 2: Enhance AuthService

In `src/modules/auth/auth.service.ts`, extend the service (inspired by existing `signUp` logic at line 20) to create or link Profiles.

```typescript
async handleGoogleLogin(user: User) {
  // Check for existing Profile
  const existingProfile = await this.profileRepo.findOne({ where: { id: user.id } });
  if (existingProfile) return this.generateJwt(existingProfile);

  // Create new Profile
  const profile = this.profileRepo.create({
    id: user.id,
    username: user.email,
    full_name: user.user_metadata?.full_name || user.email.split('@')[0],
    role: 'USER', // Default; update logic for sellers if needed
  });
  await this.profileRepo.save(profile);

  return this.generateJwt(profile);
}

private generateJwt(profile: Profile) {
  // Use existing JWT logic from codebase
  return { accessToken: this.jwtService.sign({ sub: profile.id, role: profile.role }) };
}
```

Inject `ProfileRepository` (from users module) and SupabaseService. This ensures TypeORM handles Profile creation, linking to Supabase user ID.

### Step 3: Update Guards and Middleware

Extend `JwtAuthGuard` (`src/common/guards/jwt-auth.guard.ts`) to support OAuth sessions. In `canActivate`, check for Supabase session if JWT fails.

```typescript
const { data: { user }, error } = await this.supabase.auth.getUser();
if (user) {
  const profile = await this.supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile.data) {
    request.user = profile.data;
    return true;
  }
}
```

This provides fallback auth, ensuring OAuth users are recognized.

## TypeORM Integration

Profiles are managed via the Profile entity (`src/modules/users/entities/profile.entity.ts`). The `id` field (UUID) matches Supabase's user ID. When creating Profiles, map Google metadata (e.g., full_name from `user.user_metadata`). For sellers, add logic to check role and create Seller entities if applicable. Run `npm run db:push` to apply any schema changes locally.

## Error Handling and Security

- **Errors:** Catch OAuth failures (e.g., invalid code) and throw NestJS exceptions. Log via Sentry if configured.
- **Security:** Use ThrottlerGuard for rate limiting. Validate redirectTo URLs. Logout via `this.supabase.auth.signOut()`.
- **Best Practices:** Avoid storing sensitive data; rely on Supabase for user management.

## Testing and Deployment

- **Unit Tests:** Mock Supabase client and test Profile creation in `auth.service.spec.ts`.
- **Integration:** Simulate OAuth flow locally. Use Postman for endpoints.
- **Deployment:** Ensure env vars are set. Update Swagger (`src/main.ts`) to document new endpoints.

## Troubleshooting

- **Redirect Issues:** Verify URIs match in Google/Supabase.
- **Profile Creation Fails:** Check TypeORM logs; ensure DB connection.
- **Session Errors:** Inspect Supabase auth state.

## Conclusion

This integration adds Google login to your NestJS backend, leveraging Supabase's OAuth and TypeORM's entity management. It maintains code consistency while enhancing usability. For frontend integration, handle the redirect URL in your client app.