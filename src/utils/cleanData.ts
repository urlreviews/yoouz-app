/**
 * Recursively cleans an object by removing undefined keys and standardizing values
 * for safe JSON serialization and storage.
 */
export function cleanUndefinedFields<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanUndefinedFields(item)) as any;
  }

  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedFields(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}

export const cleanForFirestore = cleanUndefinedFields;
