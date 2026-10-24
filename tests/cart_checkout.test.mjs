import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ─── 1. Cart Business Logic Helpers ──────────────────────────────────────────

function calculateCartTotals(items, enrolledCourseIds = new Set(), coupon = null) {
  // Filter out any courses user already owns
  const validItems = items.filter((item) => !enrolledCourseIds.has(item.id));

  const subtotal = validItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const originalSubtotal = validItems.reduce(
    (sum, item) => sum + (Number(item.originalPrice) || Number(item.price) || 0),
    0
  );

  let discountAmount = 0;
  if (coupon && coupon.isActive) {
    if (!coupon.minSubtotal || subtotal >= coupon.minSubtotal) {
      if (coupon.discountType === 'PERCENT') {
        discountAmount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'FLAT') {
        discountAmount = Math.min(coupon.value, subtotal);
      }
    }
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const payableTotal = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  const totalSavings = Math.round((Math.max(0, originalSubtotal - subtotal) + discountAmount) * 100) / 100;

  return {
    validItems,
    itemCount: validItems.length,
    subtotal,
    originalSubtotal,
    discountAmount,
    payableTotal,
    totalSavings,
  };
}

function addToCartHelper(cartItems, newCourse, enrolledIds = new Set()) {
  if (enrolledIds.has(newCourse.id)) {
    return { success: false, reason: 'ALREADY_ENROLLED', items: cartItems };
  }
  if (cartItems.some((item) => item.id === newCourse.id)) {
    return { success: false, reason: 'ALREADY_IN_CART', items: cartItems };
  }
  return { success: true, items: [...cartItems, newCourse] };
}

// ─── 2. Test Suite ───────────────────────────────────────────────────────────

describe('Cart, Checkout & Pricing Validation Suite', () => {
  const sampleCourses = [
    {
      id: 'course-1',
      title: 'Class 10 Science & Math Masterclass',
      price: 99,
      originalPrice: 499,
      type: 'COURSE',
    },
    {
      id: 'course-2',
      title: 'Class 12 Physics PYQ Archive',
      price: 149,
      originalPrice: 799,
      type: 'PYQ',
    },
    {
      id: 'course-3',
      title: 'AI Tools for High Schoolers',
      price: 49,
      originalPrice: 199,
      type: 'LECTURE',
    },
  ];

  test('accurately calculates subtotal, original price, and savings for multiple courses', () => {
    const totals = calculateCartTotals(sampleCourses);

    // 99 + 149 + 49 = 297
    assert.equal(totals.subtotal, 297);
    // 499 + 799 + 199 = 1497
    assert.equal(totals.originalSubtotal, 1497);
    // 1497 - 297 = 1200 savings
    assert.equal(totals.totalSavings, 1200);
    assert.equal(totals.payableTotal, 297);
    assert.equal(totals.itemCount, 3);
  });

  test('prevents adding duplicate course entries to cart', () => {
    let cart = [sampleCourses[0]];
    const duplicateResult = addToCartHelper(cart, sampleCourses[0]);

    assert.equal(duplicateResult.success, false);
    assert.equal(duplicateResult.reason, 'ALREADY_IN_CART');
    assert.equal(duplicateResult.items.length, 1);

    const newCourseResult = addToCartHelper(cart, sampleCourses[1]);
    assert.equal(newCourseResult.success, true);
    assert.equal(newCourseResult.items.length, 2);
  });

  test('disallows adding already enrolled courses to cart', () => {
    const enrolledIds = new Set(['course-1']);
    let cart = [];

    const enrolledAttempt = addToCartHelper(cart, sampleCourses[0], enrolledIds);
    assert.equal(enrolledAttempt.success, false);
    assert.equal(enrolledAttempt.reason, 'ALREADY_ENROLLED');
    assert.equal(enrolledAttempt.items.length, 0);

    const nonEnrolledAttempt = addToCartHelper(cart, sampleCourses[1], enrolledIds);
    assert.equal(nonEnrolledAttempt.success, true);
    assert.equal(nonEnrolledAttempt.items.length, 1);
  });

  test('applies percentage coupons correctly with rounding', () => {
    const coupon50 = {
      code: 'WELCOME50',
      isActive: true,
      discountType: 'PERCENT',
      value: 50,
    };

    const totals = calculateCartTotals(sampleCourses, new Set(), coupon50);
    // Subtotal = 297, 50% = 148.5
    assert.equal(totals.discountAmount, 148.5);
    assert.equal(totals.payableTotal, 148.5);
  });

  test('applies 100% coupon to yield free checkout', () => {
    const couponFree = {
      code: 'FREE100',
      isActive: true,
      discountType: 'PERCENT',
      value: 100,
    };

    const totals = calculateCartTotals(sampleCourses, new Set(), couponFree);
    assert.equal(totals.discountAmount, 297);
    assert.equal(totals.payableTotal, 0);
  });

  test('applies flat coupons without letting payable amount drop below zero', () => {
    const flatBigCoupon = {
      code: 'FLAT500',
      isActive: true,
      discountType: 'FLAT',
      value: 500,
    };

    const totals = calculateCartTotals([sampleCourses[0]], new Set(), flatBigCoupon);
    // Item is 99, flat discount is 500 -> capped at 99
    assert.equal(totals.discountAmount, 99);
    assert.equal(totals.payableTotal, 0);
  });

  test('rejects coupon when minimum subtotal requirement is not met', () => {
    const minSubtotalCoupon = {
      code: 'VIP500',
      isActive: true,
      discountType: 'PERCENT',
      value: 20,
      minSubtotal: 500,
    };

    // Subtotal 297 < 500
    const totals = calculateCartTotals(sampleCourses, new Set(), minSubtotalCoupon);
    assert.equal(totals.discountAmount, 0);
    assert.equal(totals.payableTotal, 297);
  });

  test('server-side pricing validation rejects client-submitted prices in favor of DB records', () => {
    // Client attempts to tamper with prices
    const maliciousClientPayload = [
      { id: 'course-1', price: 1 }, // tampered from 99 to 1
      { id: 'course-2', price: 0 }, // tampered from 149 to 0
    ];

    // Canonical server DB prices map
    const dbPricesMap = new Map([
      ['course-1', 99],
      ['course-2', 149],
    ]);

    // Backend calculation
    const validatedSubtotal = maliciousClientPayload.reduce((sum, item) => {
      const dbPrice = dbPricesMap.get(item.id);
      assert(dbPrice !== undefined, 'Course must exist in DB');
      return sum + dbPrice;
    }, 0);

    // Must be 248, ignoring the tampered 1 and 0
    assert.equal(validatedSubtotal, 248);
  });

  test('enrollment fulfillment is idempotent', () => {
    const existingEntitlements = new Set(['user-1_course-1']);

    function grantAccess(userId, courseId) {
      const key = `${userId}_${courseId}`;
      if (existingEntitlements.has(key)) {
        return { granted: false, reason: 'ALREADY_EXISTS' };
      }
      existingEntitlements.add(key);
      return { granted: true };
    }

    // First attempt: already exists
    const call1 = grantAccess('user-1', 'course-1');
    assert.equal(call1.granted, false);

    // New course: granted
    const call2 = grantAccess('user-1', 'course-2');
    assert.equal(call2.granted, true);

    // Repeated webhook or verification call: idempotent, does not duplicate
    const call3 = grantAccess('user-1', 'course-2');
    assert.equal(call3.granted, false);
    assert.equal(existingEntitlements.size, 2);
  });
});
