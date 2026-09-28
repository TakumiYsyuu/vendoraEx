export function loadWishlist(user) {
  if (!user?.email) return [];
  try {
    const wishlist = JSON.parse(
      localStorage.getItem(`vendora-wishlist-${user.email}`) || "[]",
    );
    if (Array.isArray(wishlist)) return wishlist;
  } catch {
    // A backend implementation would return a recoverable wishlist-loading error.
  }
  return [];
}

// This is the future persistence point for wishlist API updates.
export function saveWishlist(email, wishlistIds) {
  localStorage.setItem(
    `vendora-wishlist-${email}`,
    JSON.stringify(wishlistIds),
  );
}
