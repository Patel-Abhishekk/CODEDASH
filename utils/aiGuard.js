/**
 * AI & LLM Input Defense Utility
 * Protects against Item 10: Prompt-inject your AI (jailbreaks, instruction override, system leaks)
 */

// Heuristic patterns commonly used in prompt injection attacks
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+(in\s+)?(dan|developer|jailbreak|unrestricted)\s+mode/i,
  /system\s*prompt\s*reveal/i,
  /repeat\s+(everything|the\s+text)\s+(above|before)/i,
  /act\s+as\s+(an\s+)?unfiltered/i,
  /override\s+system\s+directive/i,
  /<\|endoftext\|>/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[SYSTEM_PROMPT\]/i,
  /\[ADMIN_OVERRIDE\]/i
];

/**
 * Checks if user input contains prompt injection patterns.
 * @param {string} input - User provided input
 * @returns {{ isSafe: boolean, matchedPattern?: string }}
 */
const detectPromptInjection = (input) => {
  if (typeof input !== 'string') {
    return { isSafe: true };
  }

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isSafe: false,
        matchedPattern: pattern.toString()
      };
    }
  }

  return { isSafe: true };
};

/**
 * Wraps user input into structured XML-like delimiters to isolate untrusted input
 * from system instructions when sending to an LLM.
 * @param {string} userInput - The raw user input
 * @param {string} tag - The boundary tag name
 * @returns {string} Delimited user input
 */
const wrapUntrustedInput = (userInput, tag = 'user_input') => {
  if (typeof userInput !== 'string') return '';
  // Sanitize closing tag inside input to prevent delimiter breakout
  const sanitized = userInput.replace(new RegExp(`</${tag}>`, 'gi'), `[escaped_tag]`);
  return `<${tag}>\n${sanitized.trim()}\n</${tag}>`;
};

module.exports = {
  detectPromptInjection,
  wrapUntrustedInput,
  PROMPT_INJECTION_PATTERNS
};
