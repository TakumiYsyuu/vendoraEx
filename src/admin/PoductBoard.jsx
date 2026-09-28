import { useState } from "react";
import { Eye, Pencil, Store } from "lucide-react";
import Status from "../components/Status";

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty admin-empty">
      <Icon size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default function ShopAndProduct({ products, onSaveProduct }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
  });
  const [formError, setFormError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const formatPrice = (price) => `₱${Number(price || 0).toLocaleString()}`;
  const showReviewNotice = (message) => {
    setReviewNotice(message);
    window.setTimeout(() => setReviewNotice(""), 3200);
  };
  const openEditor = (product) => {
    setFormError("");
    setEditingProduct(product);
    setDraft({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category || "",
    });
  };
  const updateDraft = (event) =>
    setDraft((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  const saveProduct = (event) => {
    event.preventDefault();
    const result = onSaveProduct(editingProduct, draft);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setEditingProduct(null);
    showReviewNotice("Listing changes saved.");
  };

  return (
    <div className="admin-page admin-products-page">
      <div className="page-title admin-page-title">
        <div>
          <h1>Shops & Products</h1>
          <p>Review seller shops and marketplace listings.</p>
        </div>
        <button
          className="outline admin-review-listings"
          onClick={() =>
            showReviewNotice("Choose a pencil icon to edit a listing.")
          }
        >
          <Eye size={15} /> Review Listings
        </button>
      </div>
      {products.length ?
        <section
          className="admin-product-grid"
          aria-label="Marketplace listings"
        >
          {products.map((product) => (
            <article
              className="admin-product-card"
              key={`${product.sellerEmail || product.seller}-${product.id}`}
            >
              <div
                className="admin-product-art"
                style={{ background: product.bg }}
              >
                <span aria-hidden="true">{product.icon || "📦"}</span>
              </div>
              <div className="admin-product-info">
                <h2>{product.name}</h2>
                <strong>{formatPrice(product.price)}</strong>
                <p>
                  Seller: {product.seller} · {Number(product.stock || 0)} in
                  stock
                </p>
              </div>
              <div className="admin-product-footer">
                <Status>Active</Status>
                <div className="admin-product-actions">
                  <button
                    aria-label={`View ${product.name}`}
                    title="View listing"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    aria-label={`Edit ${product.name}`}
                    title="Edit listing"
                    onClick={() => openEditor(product)}
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      : <EmptyState
          icon={Store}
          title="No marketplace listings"
          description="Seller products will appear here once they are created."
        />
      }
      {reviewNotice && (
        <div className="admin-toast" role="status">
          {reviewNotice}
        </div>
      )}
      {selectedProduct && (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedProduct(null)}
        >
          <section
            className="admin-user-dialog admin-product-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="admin-product-dialog-title">Listing details</h2>
                <p>
                  Review the product information currently available to buyers.
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={() => setSelectedProduct(null)}
              >
                ×
              </button>
            </div>
            <div className="admin-product-details">
              <div
                className="admin-product-art"
                style={{ background: selectedProduct.bg }}
              >
                <span aria-hidden="true">{selectedProduct.icon || "📦"}</span>
              </div>
              <div>
                <h3>{selectedProduct.name}</h3>
                <strong>{formatPrice(selectedProduct.price)}</strong>
                <p>Seller: {selectedProduct.seller}</p>
                <p>Category: {selectedProduct.category || "Uncategorised"}</p>
                <p>Available stock: {Number(selectedProduct.stock || 0)}</p>
                <Status>Active</Status>
              </div>
            </div>
          </section>
        </div>
      )}
      {editingProduct && (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={() => setEditingProduct(null)}
        >
          <section
            className="admin-user-dialog admin-product-dialog admin-product-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-edit-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="admin-product-edit-title">Edit listing</h2>
                <p>
                  Changes are saved directly to this seller's marketplace
                  listing.
                </p>
              </div>
              <button
                className="admin-dialog-close"
                aria-label="Close"
                onClick={() => setEditingProduct(null)}
              >
                ×
              </button>
            </div>
            <div className="admin-product-editor-context">
              <div
                className="admin-product-art"
                style={{ background: editingProduct.bg }}
              >
                <span aria-hidden="true">{editingProduct.icon || "📦"}</span>
              </div>
              <div>
                <strong>{editingProduct.name}</strong>
                <small>{editingProduct.seller}</small>
              </div>
            </div>
            <form
              className="admin-user-form admin-product-form"
              onSubmit={saveProduct}
            >
              <label>
                Product name
                <input
                  name="name"
                  value={draft.name}
                  onChange={updateDraft}
                  required
                />
              </label>
              <label>
                Category
                <select
                  name="category"
                  value={draft.category}
                  onChange={updateDraft}
                >
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home & Living</option>
                  <option>Beauty & Health</option>
                  <option>Sports & Outdoors</option>
                  <option>Toys & Games</option>
                  <option>Groceries</option>
                </select>
              </label>
              <label>
                Price
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.price}
                  onChange={updateDraft}
                  required
                />
              </label>
              <label>
                Stock
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.stock}
                  onChange={updateDraft}
                  required
                />
              </label>
              {formError && (
                <p className="admin-form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="admin-dialog-actions">
                <button type="button" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button className="primary" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
