// Currency and default values
const CURRENCY = {
  symbol: '₹',
  name: 'INR',
  code: 'INR',
};

// Default user starting wallet
const DEFAULT_WALLET_BALANCE = 1000; // ₹1000 (instead of $100)

// Minimum task bounty
const MIN_BOUNTY = 100; // ₹100 minimum

// Maximum task bounty
const MAX_BOUNTY = 100000; // ₹100,000 maximum

module.exports = {
  CURRENCY,
  DEFAULT_WALLET_BALANCE,
  MIN_BOUNTY,
  MAX_BOUNTY,
};