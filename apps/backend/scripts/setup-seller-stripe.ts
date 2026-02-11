/**
 * Script to set up seller Stripe Connect account for testing
 */
import { db, sellerDetails } from '../src/db';
import { eq } from 'drizzle-orm';

const SELLER_ID = '47d220db-95c8-4365-9ec9-530431bab107';

async function setupSellerStripe() {
  console.log('🔧 Setting up seller Stripe Connect account...');
  console.log(`Seller ID: ${SELLER_ID}`);

  try {
    // Check if seller exists
    const existing = await db.query.sellerDetails.findFirst({
      where: eq(sellerDetails.userId, SELLER_ID),
    });

    if (existing) {
      console.log('✅ Seller details found');
      console.log(`   Stripe Account ID: ${existing.stripeAccountId || 'NOT SET'}`);
      console.log(`   Payouts Enabled: ${existing.stripePayoutsEnabled}`);

      if (!existing.stripeAccountId) {
        console.log('\n⚠️  Seller does not have a Stripe Connect account');
        console.log('   Creating mock Stripe Connect account for testing...');

        await db
          .update(sellerDetails)
          .set({
            stripeAccountId: 'acct_test_' + Date.now(),
            stripePayoutsEnabled: true,
            stripeChargesEnabled: true,
            stripeOnboardingComplete: true,
            updatedAt: new Date(),
          })
          .where(eq(sellerDetails.userId, SELLER_ID));

        console.log('✅ Mock Stripe account created for testing');
      } else if (!existing.stripePayoutsEnabled) {
        console.log('\n⚠️  Seller Stripe account not enabled for payouts');
        console.log('   Enabling payouts for testing...');

        await db
          .update(sellerDetails)
          .set({
            stripePayoutsEnabled: true,
            updatedAt: new Date(),
          })
          .where(eq(sellerDetails.userId, SELLER_ID));

        console.log('✅ Payouts enabled');
      } else {
        console.log('\n✅ Seller Stripe account is fully configured');
      }
    } else {
      console.log('\n❌ Seller details not found');
      console.log('   Creating seller details with mock Stripe account...');

      await db.insert(sellerDetails).values({
        userId: SELLER_ID,
        stripeAccountId: 'acct_test_' + Date.now(),
        stripePayoutsEnabled: true,
        stripeChargesEnabled: true,
        stripeOnboardingComplete: true,
        bankAccountVerified: true,
        identityVerified: true,
        termsAcceptedAt: new Date(),
      });

      console.log('✅ Seller details created with Stripe account');
    }

    console.log('\n🎉 Setup complete!');
    console.log('The seller can now receive escrow payments.');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

setupSellerStripe();
