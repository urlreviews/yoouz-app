/**
 * Recursively cleans an object to make it 100% Firestore-safe by:
 * 1. Removing any keys whose values are undefined
 * 2. Converting nested undefined fields inside objects
 * 3. Preserving arrays, numbers, booleans, strings, and null
 */
export function cleanForFirestore<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }

  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}
