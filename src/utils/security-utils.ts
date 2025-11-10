/**
 * Security Utilities - PII Masking
 *
 * Prevents sensitive data from leaking into model context
 */

export interface MaskOptions {
  apiKeys?: boolean       // default true
  emails?: boolean        // default true
  tokens?: boolean        // default true
  urls?: boolean          // default false
  ipAddresses?: boolean   // default false
  phoneNumbers?: boolean  // default false
}

/**
 * Mask Personally Identifiable Information (PII) in text
 *
 * Prevents sensitive data from entering model context:
 * - API keys (OpenAI, Anthropic, GitHub, etc.)
 * - Email addresses
 * - Bearer tokens and Authorization headers
 * - URLs with credentials
 * - IP addresses
 * - Phone numbers
 *
 * @example
 * maskPII("API_KEY=sk-proj-abc123")
 * → "API_KEY=<REDACTED_OPENAI_KEY>"
 */
export function maskPII(text: string, options: MaskOptions = {}): string {
  const {
    apiKeys = true,
    emails = true,
    tokens = true,
    urls = false,
    ipAddresses = false,
    phoneNumbers = false
  } = options

  let masked = text

  // API Keys (OpenAI, Anthropic, GitHub, Stripe, AWS)
  if (apiKeys) {
    masked = masked
      // OpenAI keys
      .replace(/sk-[a-zA-Z0-9]{48,}/g, '<REDACTED_OPENAI_KEY>')
      .replace(/sk-proj-[a-zA-Z0-9_-]{90,}/g, '<REDACTED_OPENAI_KEY>')
      // Anthropic keys
      .replace(/sk-ant-[a-zA-Z0-9-_]{95,}/g, '<REDACTED_ANTHROPIC_KEY>')
      // GitHub tokens
      .replace(/ghp_[a-zA-Z0-9]{36}/g, '<REDACTED_GITHUB_TOKEN>')
      .replace(/gho_[a-zA-Z0-9]{36}/g, '<REDACTED_GITHUB_OAUTH>')
      .replace(/ghs_[a-zA-Z0-9]{36}/g, '<REDACTED_GITHUB_SECRET>')
      .replace(/ghr_[a-zA-Z0-9]{36}/g, '<REDACTED_GITHUB_REFRESH>')
      // Stripe keys
      .replace(/sk_live_[a-zA-Z0-9]{24,}/g, '<REDACTED_STRIPE_KEY>')
      .replace(/sk_test_[a-zA-Z0-9]{24,}/g, '<REDACTED_STRIPE_TEST_KEY>')
      // AWS keys
      .replace(/AKIA[A-Z0-9]{16}/g, '<REDACTED_AWS_KEY>')
      // Generic API keys in common formats
      .replace(/api[_-]?key[_-]?[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi, 'api_key=<REDACTED_API_KEY>')
      .replace(/apikey[_-]?[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi, 'apikey=<REDACTED_API_KEY>')
      // Secret/Token in env vars
      .replace(/SECRET[_-]?[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi, 'SECRET=<REDACTED_SECRET>')
      .replace(/TOKEN[_-]?[:=]\s*['"]?[a-zA-Z0-9_-]{20,}['"]?/gi, 'TOKEN=<REDACTED_TOKEN>')
  }

  // Email addresses
  if (emails) {
    masked = masked.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '<REDACTED_EMAIL>'
    )
  }

  // Bearer tokens and Authorization headers
  if (tokens) {
    masked = masked
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer <REDACTED_TOKEN>')
      .replace(/Authorization:\s*[^\s]+/gi, 'Authorization: <REDACTED>')
      .replace(/authorization:\s*[^\s]+/gi, 'authorization: <REDACTED>')
      // JWT tokens
      .replace(
        /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
        '<REDACTED_JWT_TOKEN>'
      )
  }

  // URLs with credentials (user:pass@host)
  if (urls) {
    masked = masked.replace(
      /https?:\/\/[^:]+:[^@]+@[^\s]+/g,
      '<REDACTED_URL_WITH_CREDENTIALS>'
    )
    // Database connection strings
    masked = masked.replace(
      /(mongodb|postgres|mysql):\/\/[^:]+:[^@]+@[^\s]+/g,
      '$1://<REDACTED_CREDENTIALS>@<REDACTED_HOST>'
    )
  }

  // IP addresses
  if (ipAddresses) {
    masked = masked.replace(
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      '<REDACTED_IP>'
    )
  }

  // Phone numbers (US/International formats)
  if (phoneNumbers) {
    masked = masked
      // US format: (555) 123-4567 or 555-123-4567
      .replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '<REDACTED_PHONE>')
      // International format: +1 555 123 4567
      .replace(/\+\d{1,3}\s?\d{3,4}\s?\d{3,4}\s?\d{4}/g, '<REDACTED_PHONE>')
  }

  return masked
}

/**
 * Mask PII in object (recursively)
 *
 * Useful for masking entire JSON objects before returning to model
 *
 * @example
 * maskPIIInObject({
 *   apiKey: "sk-proj-abc123",
 *   email: "user@example.com"
 * })
 * → {
 *   apiKey: "<REDACTED_OPENAI_KEY>",
 *   email: "<REDACTED_EMAIL>"
 * }
 */
export function maskPIIInObject<T>(obj: T, options: MaskOptions = {}): T {
  const json = JSON.stringify(obj, null, 2)
  const masked = maskPII(json, options)
  return JSON.parse(masked)
}

/**
 * Check if text contains potential PII
 *
 * Useful for warning before processing
 *
 * @example
 * containsPII("my email is user@example.com")
 * → true
 */
export function containsPII(text: string): boolean {
  // Check for common PII patterns
  const patterns = [
    /sk-[a-zA-Z0-9]{48,}/,                              // OpenAI keys
    /sk-ant-[a-zA-Z0-9-_]{95,}/,                        // Anthropic keys
    /ghp_[a-zA-Z0-9]{36}/,                              // GitHub tokens
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,  // Emails
    /Bearer\s+[a-zA-Z0-9._-]+/i,                        // Bearer tokens
    /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/  // JWT tokens
  ]

  return patterns.some(pattern => pattern.test(text))
}

/**
 * Sanitize code snippet for display
 *
 * More aggressive than maskPII - removes entire lines containing sensitive data
 *
 * @example
 * sanitizeCodeSnippet(`
 *   const API_KEY = "sk-proj-abc123"
 *   const name = "John"
 * `)
 * → `
 *   [LINE REDACTED - CONTAINS API KEY]
 *   const name = "John"
 * `
 */
export function sanitizeCodeSnippet(code: string): string {
  const lines = code.split('\n')
  const sanitized = lines.map(line => {
    // Check if line contains sensitive data
    if (containsPII(line)) {
      // Determine what kind of sensitive data
      if (/sk-[a-zA-Z0-9]{48,}|sk-ant-|ghp_|gho_/.test(line)) {
        return '[LINE REDACTED - CONTAINS API KEY]'
      }
      if (/Bearer\s+/i.test(line)) {
        return '[LINE REDACTED - CONTAINS TOKEN]'
      }
      if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(line)) {
        return '[LINE REDACTED - CONTAINS EMAIL]'
      }
      return '[LINE REDACTED - CONTAINS SENSITIVE DATA]'
    }
    return line
  })

  return sanitized.join('\n')
}
