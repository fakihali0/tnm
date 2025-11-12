export const canonicalizeHash = (hash: string) =>
  hash.replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
