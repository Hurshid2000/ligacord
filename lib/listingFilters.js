// A listing is publicly visible when it's active AND either has no deadline
// or the deadline hasn't passed. Defined once so the catalog, the AI matcher
// and the home page can never drift apart on what "expired" means.
//
// Returned as an AND-entry rather than a bare `OR` key: callers often need
// their own `OR` (text search), and two `OR` keys in one object would silently
// overwrite each other.
export function notExpired() {
  return { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] };
}

// Base filter for anything shown publicly. Extra conditions go in `and`.
export function publicListingWhere(and = []) {
  return { isActive: true, AND: [notExpired(), ...and] };
}

export function isExpired(listing) {
  return Boolean(listing.expiresAt) && new Date(listing.expiresAt) <= new Date();
}

// Turns a date string from the form into a Date, or null to clear it.
// `undefined` means "field not supplied" so PATCH can leave it untouched.
// Invalid input becomes null rather than crashing the request.
export function parseExpiry(value) {
  if (value === undefined) return undefined;
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  // A date-only value ("2026-09-30") parses to midnight UTC, which would expire
  // the listing at the very start of that day. Push it to the end of that day
  // in Tashkent (UTC+5, no DST) so "до 30 сентября" means what a local user
  // expects rather than ending mid-morning or running 5 hours long.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) d.setUTCHours(23 - 5, 59, 59, 999);
  return d;
}
