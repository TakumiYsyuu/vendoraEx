function readReviews(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(value)) return value;
  } catch {
    // A backend implementation would return a review-loading error instead.
  }
  return [];
}

function getReviewKeys(product) {
  return [`vendora-reviews-${product.id}`, `vendora-reviews-${product.name}`];
}

function getAverageRating(reviews) {
  if (!reviews.length) return 0;
  return (
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
  );
}

export function loadProductReviews(product) {
  const uniqueReviews = new Map();
  getReviewKeys(product).forEach((key) => {
    readReviews(key).forEach((review) => uniqueReviews.set(review.id, review));
  });
  return [...uniqueReviews.values()];
}

// Saves a review and refreshes the listing summary; replace storage writes with review APIs later.
export function saveReview(user, product, rating, comment) {
  const review = {
    id: Date.now(),
    name: user.name,
    rating,
    comment: comment.trim(),
  };
  const keys = getReviewKeys({
    id: product.productId || product.id,
    name: product.name,
  });
  const savedReviews = [...readReviews(keys[0]), review];
  keys.forEach((key) =>
    localStorage.setItem(key, JSON.stringify(savedReviews)),
  );

  Object.keys(localStorage)
    .filter((key) => key.startsWith("vendora-products-"))
    .forEach((key) => {
      const products = JSON.parse(localStorage.getItem(key) || "[]");
      const updatedProducts = products.map((item) => {
        const matchesProduct =
          item.id === product.productId ||
          item.id === product.id ||
          item.name === product.name;
        if (!matchesProduct) return item;
        return {
          ...item,
          rating: getAverageRating(savedReviews),
          reviews: savedReviews.length,
        };
      });
      localStorage.setItem(key, JSON.stringify(updatedProducts));
    });
  return review;
}
