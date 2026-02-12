# Download My Data Feature

## Overview

GDPR-compliant data export feature allowing users to download a copy of all their personal data stored in BarterDash.

## User Flow

```
Settings → Privacy → Download My Data
        ↓
App calls API: POST /users/me/export
        ↓
Server pulls all user data
        ↓
Server generates export file (JSON/ZIP)
        ↓
Server returns temporary download link
        ↓
User downloads their data
```

## API Endpoint

### `POST /users/me/export`

**Request:**
```http
POST /users/me/export
Authorization: Bearer <jwt_token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "download_url": "https://storage.supabase.co/.../user-exports/{userId}/{timestamp}.json?token=...",
    "expires_at": "2024-01-15T12:00:00Z",
    "file_size_mb": 2.4
  },
  "message": "Your data export is ready for download"
}
```

**Response (Rate Limited):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "You can only request one data export per 24 hours",
    "next_available_at": "2024-01-15T08:00:00Z"
  }
}
```

## Data Categories to Export

### 1. Profile Data
| Table | Fields |
|-------|--------|
| `profiles` | id, username, fullName, avatarUrl, bio, phone, email, createdAt |
| `user_interests` | Selected interest categories |
| `notification_preferences` | Push, email, SMS preferences |

### 2. Seller Data
| Table | Fields |
|-------|--------|
| `seller_applications` | Application status, business info |
| `verification_documents` | Document types (not actual files, metadata only) |
| `seller_details` | Stripe account status, sales stats, ratings |

### 3. Orders & Transactions
| Table | Fields |
|-------|--------|
| `orders` | All orders as buyer and seller |
| `order_items` | Individual items in orders |
| `payments` | Payment history |
| `refunds` | Refund requests and status |
| `escrow_transactions` | Escrow records |

### 4. Bidding Activity
| Table | Fields |
|-------|--------|
| `bids` | All bids placed |
| `auto_bids` | Proxy bidding configurations |
| `auctions` | Auctions won |

### 5. Products & Listings
| Table | Fields |
|-------|--------|
| `products` | All products listed |
| `offers` | Offers received on products |

### 6. Social & Communication
| Table | Fields |
|-------|--------|
| `follows` | Followers and following |
| `blocked_users` | Blocked users list |
| `conversations` | DM conversation metadata |
| `direct_messages` | Direct messages content |
| `chat_messages` | Stream chat messages |

### 7. Stream Activity
| Table | Fields |
|-------|--------|
| `streams` | Streams hosted |
| `saved_streams` | Saved streams |
| `stream_viewers` | Viewer history |

### 8. Financial
| Table | Fields |
|-------|--------|
| `payment_methods` | Saved payment methods (last 4 digits only) |
| `payouts` | Payout history |

### 9. Other
| Table | Fields |
|-------|--------|
| `notifications` | Notification history |
| `reports` | Reports submitted |

## Export Format Options

### Option A: Single JSON File (Recommended)
```json
{
  "export_info": {
    "user_id": "uuid",
    "exported_at": "2024-01-15T10:00:00Z",
    "version": "1.0"
  },
  "profile": { ... },
  "orders": [ ... ],
  "bids": [ ... ],
  "products": [ ... ],
  "messages": [ ... ],
  "social": { ... },
  "financial": { ... }
}
```

### Option B: ZIP Archive
```
user-data-{userId}-{timestamp}.zip
├── profile.json
├── orders.json
├── bids.json
├── products.json
├── messages.json
├── social.json
├── financial.json
├── orders.csv (optional CSV format)
├── bids.csv
└── README.txt
```

## Storage Configuration

### Supabase Storage Bucket

**Bucket Name:** `user-exports`

**RLS Policies:**
```sql
-- Users can only download their own exports
CREATE POLICY "Users can read own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only service role can write exports
CREATE POLICY "Service role can write exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-exports');
```

**File Naming Convention:**
```
user-exports/{userId}/{timestamp}.json
```

**File Retention:**
- Auto-delete after 7 days via Supabase Edge Function or cron job

## Implementation Files

### Backend

| File | Purpose |
|------|---------|
| `routes/users.routes.ts` | Add `POST /users/me/export` endpoint |
| `services/users.service.ts` | Add `exportUserData()` method |
| `services/data-export.service.ts` | **NEW** - Aggregate and format user data |
| `repositories/users.repository.ts` | Add `findAllUserData()` method |
| `schemas/users.schemas.ts` | Add export request/response schemas |

### Mobile

| File | Purpose |
|------|---------|
| `app/settings/privacy.tsx` | **NEW** - Privacy settings screen |
| `app/settings/index.tsx` | Wire navigation to privacy screen |
| `lib/api/services/users.ts` | Add `exportData()` API method |

## Backend Implementation

### 1. Route (`routes/users.routes.ts`)

```typescript
/**
 * POST /users/me/export
 * Request a data export
 * Protected - requires JWT
 * Rate limited: 1 per 24 hours
 */
router.post(
  '/me/export',
  authenticate,
  rateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 1 }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await usersService.exportUserData(userId);

    if (result.isErr()) {
      throw result.error;
    }

    res.status(200).json({
      success: true,
      data: result.value,
      message: 'Your data export is ready for download',
    });
  }),
);
```

### 2. Service (`services/data-export.service.ts`)

```typescript
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { supabase } from '../utils/supabase';

export class DataExportService {
  async exportUserData(userId: string): Promise<{
    download_url: string;
    expires_at: string;
    file_size_mb: number;
  }> {
    // 1. Aggregate all user data
    const userData = await this.aggregateUserData(userId);
    
    // 2. Generate JSON file
    const jsonData = JSON.stringify(userData, null, 2);
    const fileName = `user-exports/${userId}/${Date.now()}.json`;
    
    // 3. Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('user-exports')
      .upload(fileName, jsonData, {
        contentType: 'application/json',
        upsert: false,
      });
    
    if (error) throw error;
    
    // 4. Generate signed URL (expires in 1 hour)
    const { data: urlData } = await supabase.storage
      .from('user-exports')
      .createSignedUrl(fileName, 3600);
    
    return {
      download_url: urlData.signedUrl,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      file_size_mb: Buffer.byteLength(jsonData) / (1024 * 1024),
    };
  }

  private async aggregateUserData(userId: string) {
    const [
      profile,
      orders,
      bids,
      products,
      messages,
      social,
      financial,
    ] = await Promise.all([
      this.getProfile(userId),
      this.getOrders(userId),
      this.getBids(userId),
      this.getProducts(userId),
      this.getMessages(userId),
      this.getSocial(userId),
      this.getFinancial(userId),
    ]);

    return {
      export_info: {
        user_id: userId,
        exported_at: new Date().toISOString(),
        version: '1.0',
      },
      profile,
      orders,
      bids,
      products,
      messages,
      social,
      financial,
    };
  }

  private async getProfile(userId: string) { /* ... */ }
  private async getOrders(userId: string) { /* ... */ }
  private async getBids(userId: string) { /* ... */ }
  private async getProducts(userId: string) { /* ... */ }
  private async getMessages(userId: string) { /* ... */ }
  private async getSocial(userId: string) { /* ... */ }
  private async getFinancial(userId: string) { /* ... */ }
}
```

## Mobile Implementation

### 1. Privacy Settings Screen (`app/settings/privacy.tsx`)

```typescript
import React, { useState } from 'react';
import { View, Alert, Linking } from 'react-native';
import { Box, VStack, Text, Pressable, HStack, Spinner } from '@gluestack-ui/themed';
import { Download, Shield, Eye, Clock } from 'lucide-react-native';
import { usersService } from '@/lib/api/services/users';
import { COLORS } from '@/constants/colors';

export default function PrivacySettingsScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<Date | null>(null);

  const handleExportData = async () => {
    Alert.alert(
      'Download Your Data',
      'We\'ll prepare a copy of all your data. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: async () => {
            setIsExporting(true);
            try {
              const result = await usersService.exportData();
              setLastExport(new Date());
              
              Alert.alert(
                'Export Ready',
                'Your data is ready for download. The link expires in 1 hour.',
                [
                  {
                    text: 'Download Now',
                    onPress: () => Linking.openURL(result.download_url),
                  },
                  { text: 'Later' },
                ]
              );
            } catch (error: any) {
              if (error.response?.data?.error?.code === 'RATE_LIMITED') {
                Alert.alert(
                  'Please Wait',
                  'You can only request one export per 24 hours.',
                );
              } else {
                Alert.alert('Error', 'Failed to export data. Please try again.');
              }
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Box flex={1} bg={COLORS.luxuryBlack}>
      <VStack p="$6" space="lg">
        {/* Download Data Section */}
        <Box bg={COLORS.luxuryBlackLight} p="$5" rounded="$2xl" borderWidth={1} borderColor={COLORS.darkBorder}>
          <HStack alignItems="center" space="md" mb="$4">
            <Download size={24} color={COLORS.primaryGold} />
            <Text color={COLORS.textPrimary} fontWeight="$bold" size="lg">
              Download Your Data
            </Text>
          </HStack>
          <Text color={COLORS.textSecondary} size="sm" mb="$4">
            Get a copy of all your personal data stored in BarterDash, including your profile, orders, bids, messages, and more.
          </Text>
          <Pressable
            onPress={handleExportData}
            disabled={isExporting}
            bg={COLORS.primaryGold}
            py="$4"
            rounded="$xl"
            alignItems="center"
          >
            {isExporting ? (
              <HStack space="sm" alignItems="center">
                <Spinner size="small" color={COLORS.luxuryBlack} />
                <Text color={COLORS.luxuryBlack} fontWeight="$bold">Preparing Export...</Text>
              </HStack>
            ) : (
              <Text color={COLORS.luxuryBlack} fontWeight="$bold">Request Data Export</Text>
            )}
          </Pressable>
          {lastExport && (
            <HStack alignItems="center" space="xs" mt="$3" justifyContent="center">
              <Clock size={14} color={COLORS.textMuted} />
              <Text color={COLORS.textMuted} size="xs">
                Last export: {lastExport.toLocaleDateString()}
              </Text>
            </HStack>
          )}
        </Box>

        {/* Info Cards */}
        <VStack space="md">
          <InfoCard
            icon={<Eye size={20} color={COLORS.textSecondary} />}
            title="What's Included"
            description="Profile, orders, bids, products, messages, social connections, and financial records"
          />
          <InfoCard
            icon={<Shield size={20} color={COLORS.textSecondary} />}
            title="Privacy First"
            description="Exports are generated on-demand and the download link expires after 1 hour"
          />
        </VStack>
      </VStack>
    </Box>
  );
}

function InfoCard({ icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <Box bg={COLORS.luxuryBlackLight} p="$4" rounded="$xl" borderWidth={1} borderColor={COLORS.darkBorder}>
      <HStack space="md">
        {icon}
        <VStack flex={1}>
          <Text color={COLORS.textPrimary} fontWeight="$bold" size="sm">{title}</Text>
          <Text color={COLORS.textSecondary} size="xs" mt="$1">{description}</Text>
        </VStack>
      </HStack>
    </Box>
  );
}
```

### 2. API Service (`lib/api/services/users.ts`)

```typescript
export const usersService = {
  // ... existing methods

  exportData: async (): Promise<{
    download_url: string;
    expires_at: string;
    file_size_mb: number;
  }> => {
    const response = await apiClient.post<ApiResponse<{
      download_url: string;
      expires_at: string;
      file_size_mb: number;
    }>>('/users/me/export');
    return response.data.data;
  },
};
```

### 3. Update Settings Index (`app/settings/index.tsx`)

```typescript
// Update the Privacy & Visibility item:
<SettingsItem
  icon={<Eye size={20} color={COLORS.textPrimary} />}
  label="Privacy & Visibility"
  onPress={() => router.push('/settings/privacy')}
/>
```

## Security Considerations

1. **Authentication Required**: Only authenticated users can request their own data
2. **Rate Limiting**: Maximum 1 export per 24 hours per user
3. **Signed URLs**: Download links expire after 1 hour
4. **RLS Policies**: Storage bucket prevents unauthorized access
5. **No Sensitive Data**: Export excludes:
   - Passwords/hashes
   - Full credit card numbers (last 4 digits only)
   - Stripe API keys
   - Session tokens

## Database Migration

```sql
-- Create user-exports storage bucket (via Supabase Dashboard or API)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-exports', 'user-exports', false);

-- RLS policies for user-exports bucket
CREATE POLICY "Users can read own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Future Enhancements

1. **Email Delivery**: Option to receive export via email
2. **Multiple Formats**: CSV, PDF summary
3. **Selective Export**: Choose specific data categories
4. **Scheduled Exports**: Automatic monthly exports
5. **Deletion Request**: GDPR right to be forgotten workflow
