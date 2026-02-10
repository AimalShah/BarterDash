import { db } from '../db';
import {
  orders,
  shippingLabels,
  profiles,
  products,
  categories,
} from '../db/schema';
import { shippingService } from '../services/shipping.service';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function verifyShipping() {
  console.log('🚀 Starting Shipping Verification...');

  try {
    // 1. Setup Test Data
    console.log('1. Setting up test data...');

    // Create/Get Category
    let category = await db.query.categories.findFirst();
    if (!category) {
      const catId = uuidv4();
      await db.insert(categories).values({
        id: catId,
        name: 'Test Category',
        slug: 'test-category-' + Date.now(),
      });
      category = { id: catId } as any;
    }

    // Create Seller
    const sellerId = uuidv4();
    await db.insert(profiles).values({
      id: sellerId,
      username: `seller_${Date.now()}`,
      email: `seller_${Date.now()}@test.com`,
      fullName: 'Test Seller',
    } as any); // Type assertion to bypass some required fields if any (though schema says most are optional or have defaults)

    // Create Buyer
    const buyerId = uuidv4();
    await db.insert(profiles).values({
      id: buyerId,
      username: `buyer_${Date.now()}`,
      email: `buyer_${Date.now()}@test.com`,
      fullName: 'Test Buyer',
    } as any);

    // Create Product
    const productId = uuidv4();
    await db.insert(products).values({
      id: productId,
      sellerId: sellerId,
      categoryId: category!.id,
      title: 'Test Product',
      condition: 'new',
      status: 'active',
    });

    // Create Order
    const orderId = uuidv4();
    await db.insert(orders).values({
      id: orderId,
      orderNumber: `ORD-${Date.now()}`,
      buyerId: buyerId,
      sellerId: sellerId,
      productId: productId,
      orderType: 'buy_now',
      itemPrice: '100.00',
      total: '100.00',
      status: 'processing', // Ready for label
      shippingAddress: {
        name: 'Test Buyer',
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
    });

    console.log(`   Created Order: ${orderId}`);

    // 2. Test Generate Label
    console.log('2. Testing generateLabel()...');
    const result = await shippingService.generateLabel(orderId, sellerId);

    if (result.isErr()) {
      console.error('❌ generateLabel Failed:', result.error);
      process.exit(1);
    }

    const label = result.value;
    console.log('✅ Label Generated:', label);

    if (!label.trackingNumber || !label.labelUrl) {
      console.error('❌ Label missing data');
      process.exit(1);
    }

    // 3. Verify Database Updates
    console.log('3. Verifying Database Updates...');

    // Check Shipping Labels Table
    const savedLabel = await db.query.shippingLabels.findFirst({
      where: eq(shippingLabels.orderId, orderId),
    });

    if (!savedLabel) {
      console.error('❌ Label not saved to shipping_labels table');
      process.exit(1);
    }
    console.log('✅ Label saved to DB');

    // Check Status Update
    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (updatedOrder?.status !== 'shipped') {
      console.error(
        `❌ Order status mismatch. Expected 'shipped', got '${updatedOrder?.status}'`,
      );
      process.exit(1);
    }
    console.log('✅ Order status updated to "shipped"');

    if (updatedOrder?.trackingNumber !== label.trackingNumber) {
      console.error('❌ Tracking number mismatch in orders table');
      process.exit(1);
    }
    console.log('✅ Tracking number synced to orders table');

    console.log('🎉 Verification Successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification Failed:', error);
    process.exit(1);
  }
}

verifyShipping();
