const crypto = require('crypto');

/**
 * Payment & Webhook Security Utilities
 * Protects against Item 6: Fake a payment (unverified webhooks, spoofed payment callbacks)
 */

/**
 * Verifies a cryptographic HMAC signature from payment providers (e.g., Stripe, Razorpay)
 * using timing-safe comparison to prevent timing attacks.
 *
 * @param {string|Buffer} rawPayload - The raw webhook payload body
 * @param {string} signatureHeader - The signature header received from the provider
 * @param {string} secretKey - The webhook signing secret
 * @param {string} algorithm - Hashing algorithm, defaults to 'sha256'
 * @returns {boolean} Whether signature is valid
 */
const verifyWebhookSignature = (rawPayload, signatureHeader, secretKey, algorithm = 'sha256') => {
  if (!rawPayload || !signatureHeader || !secretKey) {
    return false;
  }

  try {
    const payloadString = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
    const expectedSignature = crypto
      .createHmac(algorithm, secretKey)
      .update(payloadString)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(signatureHeader);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

/**
 * Validates transaction amounts to prevent price/balance tampering (Item 4 & 5)
 * @param {number} requestedAmount
 * @param {number} serverExpectedAmount
 */
const validatePaymentAmount = (requestedAmount, serverExpectedAmount) => {
  const reqNum = Number(requestedAmount);
  const expNum = Number(serverExpectedAmount);

  if (!Number.isFinite(reqNum) || reqNum <= 0) return false;
  if (!Number.isFinite(expNum) || expNum <= 0) return false;

  // Strict equality check between server price and requested price
  return Math.abs(reqNum - expNum) < 0.001;
};

module.exports = {
  verifyWebhookSignature,
  validatePaymentAmount
};
