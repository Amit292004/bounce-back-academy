// Quick Cashfree API test script
const APP_ID = "13104117cdde90a7cd9603a3ed41140131";
const SECRET_KEY = "cfsk_ma_prod_3dfbadfebfa850e5edd0a2e5ceda8299_c1654d22";
const BASE_URL = "https://api.cashfree.com/pg";

async function testCashfree() {
  console.log("🔍 Testing Cashfree Production API...\n");

  try {
    // Create a test order
    const orderId = `test_${Date.now()}`;
    const payload = {
      order_id: orderId,
      order_amount: 1.00,
      order_currency: "INR",
      customer_details: {
        customer_id: "test_user_001",
        customer_name: "Test Student",
        customer_email: "test@bouncebackacademy.com",
        customer_phone: "9999999999"
      },
      order_meta: {
        return_url: "https://bouncebackacademy.vercel.app/payment/return?order_id={order_id}&premiumItemId=test"
      },
      order_note: "Cashfree Integration Test"
    };

    console.log("📤 Creating test order with Cashfree...");
    const res = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET_KEY,
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      console.log("✅ SUCCESS! Cashfree API is working.\n");
      console.log("📦 Order Created:");
      console.log("   Order ID:          ", data.order_id);
      console.log("   Order Status:      ", data.order_status);
      console.log("   Payment Session ID:", data.payment_session_id);
      console.log("   Amount:            ₹", data.order_amount);
      console.log("   Currency:          ", data.order_currency);
      console.log("\n🎉 Cashfree integration is LIVE and working!");
    } else {
      console.log("❌ FAILED! Cashfree API returned an error:\n");
      console.log("   Status Code:", res.status);
      console.log("   Error:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log("❌ Network error:", err.message);
  }
}

testCashfree();
