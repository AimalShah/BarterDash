# BarterDash Mobile App - Architecture & Structure Guide

## Overview
This is the mobile application for BarterDash - a live-streaming e-commerce marketplace platform. This guide serves as the source of truth for the app's architecture, structure, and coding standards.

## Technology Stack

### Core
- **Framework**: React Native with Expo (SDK 54)
- **Router**: Expo Router v6 (file-based routing)
- **Language**: TypeScript 5.9.2
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query) v5
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **UI Components**: components based on react-native-reusables

### Key Dependencies
- `@tanstack/react-query` - Data fetching and caching
- `zustand` - State management
- `nativewind` - Tailwind CSS for React Native
- `expo-router` - File-based routing
- `@supabase/supabase-js` - Authentication and database
- `@stripe/stripe-react-native` - Payment processing
- `@stream-io/video-react-native-sdk` - Live streaming
- `lucide-react-native` - Icons

## Color Scheme (DO NOT CHANGE)

### Primary Brand Colors
- **Primary Blue**: `#6391F2` - Buttons, highlights, icons, active tabs
- **Soft Blue**: `#B2CBEC` - Background accents and cards
- **Blue-Lavender Gradient**: `#9CA9DE` - Hero banner gradient tone

### Backgrounds & Surfaces
- **Main Background**: `#F2F1F8` - Overall app background
- **Card Background**: `#FFFFFF` - White cards
- **Light Grey**: `#9C9AA6` - Secondary text / UI dividers

### Text & Contrast
- **Primary Text**: `#22232D` - Headings and strong labels
- **Secondary Dark**: `#2F354E` - Supporting text

### Accent / Highlight Colors
- **Warm Highlight**: `#F2D468` - Product accents and visual warmth
- **Soft Gold**: `#E7D7A2` - Subtle illustration accents
- **Muted Blue-Grey**: `#768CAB` - Secondary UI elements

### Status Colors
- **Success**: `#22c55e`
- **Error**: `#EF4444`
- **Warning**: `#F59E0B`

**Overall Style**: Cool blue system with soft pastel gradients + neutral greys — modern marketplace aesthetic.

## Project Structure

```
/apps/mobile/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/                   # Auth group (no bottom tabs)
│   │   ├── _layout.tsx          # Auth layout
│   │   ├── landing.tsx          # Landing/welcome screen
│   │   ├── login.tsx            # Login screen
│   │   ├── register.tsx         # Registration screen
│   │   ├── forgot-password.tsx  # Forgot password
│   │   ├── verify-email.tsx     # Email verification
│   │   └── update-password.tsx  # Password reset
│   │
│   ├── (tabs)/                   # Main app with bottom tabs
│   │   ├── _layout.tsx          # Tab layout
│   │   ├── index.tsx            # Home screen (shows & products)
│   │   ├── categories.tsx       # Categories/discover
│   │   ├── cart.tsx             # Shopping cart
│   │   ├── profile.tsx          # User profile
│   │   ├── sell.tsx             # Sell button (redirects)
│   │   ├── search.tsx           # Search screen
│   │   ├── inbox.tsx            # Messages/notifications
│   │   ├── my-bids.tsx          # My auctions/bids
│   │   └── checkout.tsx         # Checkout flow
│   │
│   ├── (onboarding)/             # Onboarding flow
│   │   ├── _layout.tsx          # Onboarding layout
│   │   ├── profile-setup.tsx    # Profile setup
│   │   ├── age-verification.tsx # Age verification
│   │   ├── interests.tsx        # Interest selection
│   │   ├── notifications.tsx    # Notification preferences
│   │   └── success.tsx          # Onboarding complete
│   │
│   ├── product/                  # Product screens
│   │   └── [id].tsx             # Product detail
│   │
│   ├── stream/                   # Streaming screens
│   │   └── [id].tsx             # Stream viewer
│   │
│   ├── auction/                  # Auction screens
│   │   └── [id].tsx             # Auction detail
│   │
│   ├── checkout/                 # Checkout screens
│   │   ├── cart.tsx             # Cart checkout
│   │   └── [orderId].tsx        # Order checkout
│   │
│   ├── seller/                   # Seller dashboard
│   │   ├── _layout.tsx          # Seller layout
│   │   ├── dashboard.tsx        # Seller dashboard
│   │   ├── register.tsx         # Seller registration
│   │   ├── onboarding/          # Onboarding sub-screens
│   │   │   └── index.tsx
│   │   ├── inventory.tsx        # Inventory management
│   │   ├── orders.tsx           # Orders list
│   │   ├── order/[id].tsx       # Order detail
│   │   ├── earnings.tsx         # Earnings/sales
│   │   ├── streams.tsx          # Streams list
│   │   ├── auctions.tsx         # Auctions list
│   │   ├── create-stream.tsx    # Create stream
│   │   ├── create-auction.tsx   # Create auction
│   │   ├── go-live.tsx          # Go live
│   │   ├── add-product.tsx      # Add product
│   │   ├── stripe-setup.tsx     # Stripe Connect setup
│   │   ├── sales.tsx            # Sales history
│   │   ├── stream/[id].tsx      # Stream management
│   │   ├── stream/edit/[id].tsx # Edit stream
│   │   └── stream/add-product/[id].tsx # Add product to stream
│   │
│   ├── user/                     # User profiles
│   │   └── [id].tsx             # Public user profile
│   │
│   ├── messages/                 # Messaging
│   │   ├── _layout.tsx
│   │   ├── [id].tsx             # Conversation
│   │   └── new.tsx              # New message
│   │
│   ├── social/                   # Social features
│   │   ├── _layout.tsx
│   │   ├── followers/[id].tsx   # Followers list
│   │   └── following/[id].tsx   # Following list
│   │
│   ├── settings/                 # Settings
│   │   ├── index.tsx            # Settings main
│   │   ├── change-password.tsx  # Change password
│   │   └── privacy.tsx          # Privacy settings
│   │
│   ├── notifications.tsx         # Notifications center
│   ├── help-support.tsx          # Help & support
│   ├── products.tsx              # Products list
│   ├── menu.tsx                  # Menu drawer
│   ├── _layout.tsx               # Root layout
│   └── dev/                      # Dev/testing screens
│       ├── home.tsx
│       ├── components.tsx
│       └── commerce.tsx
│
├── components/                   # React components
│   ├── ui/                       # Base UI components (reusable)
│   │   ├── button.tsx           # Button component
│   │   ├── card.tsx             # Card component
│   │   ├── input.tsx            # Input component
│   │   ├── text.tsx             # Text component
│   │   ├── badge.tsx            # Badge component
│   │   ├── avatar.tsx           # Avatar component
│   │   ├── skeleton.tsx         # Loading skeleton
│   │   └── index.ts             # Exports
│   │
│   ├── auth/                     # Auth-specific components
│   ├── home/                     # Home screen components
│   ├── stream/                   # Streaming components
│   ├── seller/                   # Seller components
│   ├── payment/                  # Payment components
│   ├── profile/                  # Profile components
│   ├── onboarding/               # Onboarding components
│   ├── user/                     # User components
│   ├── guards/                   # Auth guards
│   └── notifications/            # Notification components
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts               # Authentication hook
│   ├── useAuthGuard.ts          # Auth guard hook
│   ├── useCart.ts               # Cart operations
│   ├── useStreams.ts            # Streams data (TanStack Query)
│   ├── useProducts.ts           # Products data (TanStack Query)
│   ├── useCategories.ts         # Categories data (TanStack Query)
│   ├── useAuction.ts            # Auction data
│   ├── useBidding.ts            # Bidding operations
│   ├── useChat.ts               # Chat operations
│   ├── useCheckout.ts           # Checkout flow
│   ├── useDashboard.ts          # Seller dashboard
│   ├── useLiveStream.ts         # Live streaming
│   ├── useNotifications.ts      # Notifications
│   ├── useProfileSetup.ts       # Profile setup
│   ├── useSellerApplication.ts  # Seller application
│   └── index.ts                 # Exports
│
├── lib/                          # Utilities and services
│   ├── api/                      # API services
│   │   ├── services/            # Service modules
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── products.ts
│   │   │   ├── streams.ts
│   │   │   ├── categories.ts
│   │   │   ├── cart.ts
│   │   │   ├── orders.ts
│   │   │   ├── payments.ts
│   │   │   ├── auctions.ts
│   │   │   ├── bids.ts
│   │   │   ├── sellers.ts
│   │   │   ├── messages.ts
│   │   │   ├── notifications.ts
│   │   │   └── social.ts
│   │   ├── client.ts            # API client setup
│   │   └── index.ts             # Exports
│   │
│   ├── auth/                     # Auth utilities
│   ├── config/                   # Configuration
│   ├── connection/               # Connection management
│   ├── notifications/            # Notification utilities
│   ├── payments/                 # Payment utilities
│   ├── bidding/                  # Bidding utilities
│   ├── utils/                    # General utilities
│   ├── supabase.ts              # Supabase client
│   ├── navigation.ts            # Navigation utilities
│   └── utils.ts                 # General utilities
│
├── constants/                    # Constants
│   └── colors.ts                # Color constants
│
├── stores/                       # Zustand stores
│   ├── authStore.ts             # Auth state
│   ├── cartStore.ts             # Cart state
│   ├── streamStore.ts           # Stream state
│   └── index.ts                 # Exports
│
├── types/                        # TypeScript types
│   ├── auth.ts
│   ├── user.ts
│   ├── product.ts
│   ├── stream.ts
│   ├── auction.ts
│   ├── order.ts
│   ├── cart.ts
│   ├── seller.ts
│   ├── message.ts
│   └── index.ts
│
├── assets/                       # Static assets
│   ├── images/
│   └── fonts/
│
├── tailwind.config.js           # Tailwind configuration
├── global.css                   # Global styles
├── theme.ts                     # Theme configuration
└── package.json                 # Dependencies
```

## Coding Standards

### File Size
- **Maximum 280 lines per file**
- If a file exceeds 280 lines, split into components in `[screen]/components/` directory

### Data Fetching
- **USE TanStack Query for ALL data fetching**
- **AVOID useEffect for data fetching**
- Only use useEffect for:
  - WebSocket subscriptions (real-time features)
  - Event listeners
  - Animation triggers

Example:
```typescript
// GOOD - TanStack Query
const { data: products, isLoading } = useQuery({
  queryKey: ['products', category],
  queryFn: () => productsService.findAll({ category }),
});

// BAD - useEffect for data fetching
useEffect(() => {
  fetchProducts(); // Don't do this
}, []);
```

### Styling
- **USE Tailwind CSS classes via NativeWind**
- **DO NOT USE StyleSheet**
- **DO NOT USE inline styles**
- Use the color scheme defined above
- Components should accept className prop for customization

Example:
```typescript
// GOOD
<View className="bg-background flex-1 p-4">
  <Text className="text-primary font-semibold text-lg">
    Hello World
  </Text>
</View>

// BAD
<View style={{ backgroundColor: '#F2F1F8', flex: 1, padding: 16 }}>
  <Text style={{ color: '#22232D', fontWeight: '600', fontSize: 18 }}>
    Hello World
  </Text>
</View>
```

### Component Structure
```typescript
// Component file structure
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onPress: () => void;
  className?: string;
}

export function MyComponent({ title, onPress, className }: MyComponentProps) {
  return (
    <View className={`p-4 ${className}`}>
      <Text className="text-primary text-lg">{title}</Text>
      <Button onPress={onPress}>Press me</Button>
    </View>
  );
}
```

### TypeScript
- Use strict TypeScript
- Define interfaces for all props
- Use proper typing, avoid `any`
- Use union types for variants

### Naming Conventions
- Components: PascalCase (e.g., `MyComponent`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth`)
- Files: kebab-case (e.g., `my-component.tsx`)
- Constants: UPPER_SNAKE_CASE

## Component Guidelines

### Button Component
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
}
```

### Card Component
```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'outline';
  children: React.ReactNode;
  className?: string;
}
```

### Input Component
```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  className?: string;
}
```

### Text Component
```typescript
interface TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'muted';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
  className?: string;
}
```

## Screen Guidelines

### Auth Screens
- Clean, minimal design
- Centered content
- Clear CTAs
- Social login options
- Link to terms/privacy

### Home Screen
- Hero banner with gradient (#9CA9DE)
- Category filters
- Grid of streams/products
- Pull-to-refresh
- Live indicator

### Product Detail
- Image carousel
- Product info
- Seller info
- Add to cart / Buy now buttons
- Related products

### Cart
- List of items
- Quantity controls
- Price breakdown
- Checkout button
- Empty state

### Stream Viewer
- Video player (full width)
- Chat overlay
- Product showcase
- Bid controls (if auction)
- Viewer count

## State Management

### Zustand Stores

**Auth Store**:
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}
```

**Cart Store**:
```typescript
interface CartState {
  items: CartItem[];
  total: number;
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}
```

## API Integration

### TanStack Query Setup
```typescript
// hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ['products', category],
    queryFn: () => productsService.findAll({ category }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Service Pattern
```typescript
// lib/api/services/products.ts
export const productsService = {
  async findAll(params?: { category?: string }) {
    const { data } = await apiClient.get('/products', { params });
    return data;
  },

  async findById(id: string) {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },

  async create(product: CreateProductDTO) {
    const { data } = await apiClient.post('/products', product);
    return data;
  },
};
```

## Navigation

### Expo Router File Structure
- `app/(auth)/` - Auth routes (no tabs)
- `app/(tabs)/` - Main app routes (with bottom tabs)
- `app/(onboarding)/` - Onboarding flow
- `app/product/[id].tsx` - Dynamic product route
- `app/stream/[id].tsx` - Dynamic stream route

### Navigation Patterns
```typescript
// Navigation using Expo Router
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate to screen
router.push('/product/123');

// Navigate with params
router.push({
  pathname: '/product/[id]',
  params: { id: '123' }
});

// Go back
router.back();

// Replace current screen
router.replace('/home');
```

## Testing

### Testing Strategy
- Unit tests for utilities
- Integration tests for hooks
- E2E tests for critical flows

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:property # Property-based tests
```

## Build & Deployment

### Development
```bash
npm start        # Start Metro bundler
npm run android  # Run on Android
npm run ios      # Run on iOS
```

### Production
```bash
eas build --platform ios
eas build --platform android
```

## Important Notes for AI Assistants

1. **NEVER change the color scheme** - Use the exact colors defined above
2. **NEVER exceed 280 lines per file** - Split into components if needed
3. **ALWAYS use TanStack Query** for data fetching, not useEffect
4. **NEVER use StyleSheet or inline styles** - Use Tailwind classes
5. **ALWAYS use TypeScript** with proper types
6. **NEVER remove or modify** the structure defined in this guide without explicit permission
7. **ALWAYS follow** the component patterns defined above
8. **NEVER add** new dependencies without approval
9. **ALWAYS maintain** existing functionality when refactoring
10. **ALWAYS test** your changes before submitting

## File Modification Rules

When modifying files:
1. Read the existing file first
2. Understand its purpose and structure
3. Make minimal, targeted changes
4. Ensure TypeScript compiles without errors
5. Verify the file is under 280 lines after changes
6. Test on both iOS and Android if possible

## Contact

For questions about this architecture, refer to this document first. Do not deviate from these standards without explicit approval.
