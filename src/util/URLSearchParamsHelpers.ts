/**
 * Merge multiple URLSearchParams objects into a single URLSearchParams.
 *
 * Rules:
 * 1. Within a single URLSearchParams, duplicate keys are allowed.
 *    Example: `filter=active&filter=pending` is valid.
 * 2. Across different URLSearchParams objects, duplicate keys are NOT allowed.
 *    If the same key appears in more than one URLSearchParams, an error is thrown.
 * 3. The merged result preserves all key-value pairs, including duplicates
 *    that existed within the individual URLSearchParams objects.
 *
 * @param params - An array of URLSearchParams to merge.
 * @returns A new URLSearchParams containing all key-value pairs.
 * @throws Error if any key is duplicated across different URLSearchParams objects.
 *
 * @example
 * const params1 = new URLSearchParams("filter=active&filter=pending");
 * const params2 = new URLSearchParams("sort=role,desc");
 * const params3 = new URLSearchParams("page=1");
 *
 * const merged = merge([params1, params2, params3]);
 * console.log(merged.toString());
 * // Output: "filter=active&filter=pending&sort=role,desc&page=1"
 */
export const merge = (params: URLSearchParams[]): URLSearchParams => {
    const merged = new URLSearchParams();
    const seenKeys = new Set<string>();
  
    for (const p of params) {
      // Check for duplicate keys across different URLSearchParams
      for (const key of p.keys()) {
        if (seenKeys.has(key)) {
          throw new Error(`Duplicate URLSearchParams key across different params: "${key}"`);
        }
      }
  
      // Mark all keys in this URLSearchParams as seen
      for (const key of p.keys()) {
        seenKeys.add(key);
      }
  
      // Append all key-value pairs (preserving duplicates within the same URLSearchParams)
      for (const [key, value] of p) {
        merged.append(key, value);
      }
    }
  
    return merged;
  };  