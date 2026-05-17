/**
 * JWT Token Utilities
 * Provides functions to decode and extract information from JWT tokens
 */

/**
 * JWT Payload Interface
 * Based on Route E-commerce API token structure
 * ⚠️ IMPORTANT: The API uses "id" not "userId" in the JWT payload
 */
export interface JwtPayload {
  id: string;              // User ID from token (API uses "id" not "userId")
  name?: string;           // User name (included in token)
  role?: string;           // User role
  iat?: number;            // Issued at timestamp
  exp?: number;            // Expiration timestamp
}

/**
 * Decode JWT token and extract payload
 * Note: This only decodes - it does NOT verify the signature
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decoded) as JwtPayload;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}

/**
 * Extract user ID from JWT token
 * @param token - JWT token string
 * @returns User ID or null if not found
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = decodeJwt(token);
  return payload?.id || null;  // ⚠️ API uses "id" not "userId"
}

/**
 * Check if JWT token is expired
 * @param token - JWT token string
 * @returns True if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  
  if (!payload || !payload.exp) {
    return true; // Consider invalid tokens as expired
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
}

/**
 * Get time until token expiration in milliseconds
 * @param token - JWT token string
 * @returns Milliseconds until expiration, or 0 if expired/invalid
 */
export function getTokenExpirationTime(token: string): number {
  const payload = decodeJwt(token);
  
  if (!payload || !payload.exp) {
    return 0;
  }
  
  const expirationTime = payload.exp * 1000;
  const timeRemaining = expirationTime - Date.now();
  
  return Math.max(0, timeRemaining);
}

