const Razorpay = require('razorpay');

let instance = null;

/**
 * Lazily-created singleton Razorpay client.
 * Reads keys from env at call time (not at module load) so tests can
 * stub process.env before the first real call.
 */
function getRazorpayClient() {
  if (instance) return instance;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in environment variables');
  }

  instance = new Razorpay({ key_id, key_secret });
  return instance;
}

module.exports = { getRazorpayClient };
