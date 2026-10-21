import { useEffect, useState } from "react";
import { Plus, ArrowLeft, Pencil, Trash2, Package } from "lucide-react";
import ProductArt from "../components/ProductArt";
import VerificationRequiredModal from "./VerificationRequiredModal";
import { getMyProducts, updateProduct, deleteProduct } from "../logic/products";
import { money } from "../utils/helpers";
import useVerificationStatus from "../logic/useVerificationStatus";

export default function SellerProducts({ go }) {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("All");
  const [editing, setEditing] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const {
    status,
    loading: statusLoading,
    isVerified,
  } = useVerificationStatus();

  useEffect(() => {
    if (statusLoading) return;

    // Unverified seller: don't call the API (no 403), just show an empty list
    if (!isVerified) {
      setProductList([]);
      setError("");
      setLoading(false);
      return;
    }

    let active = true;
    getMyProducts()
      .then((list) => active && setProductList(list))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [statusLoading, isVerified]);

  const matchesTab = (product, filter) =>
    filter === "All" ||
    (filter === "Active" && product.stock > 0) ||
    (filter === "Out of Stock" && product.stock === 0) ||
    (filter === "Draft" && product.draft);
  const visibleProducts = productList.filter((product) =>
    matchesTab(product, tab),
  );

  // Stay on My Products and show the popup if the seller isn't verified
  const handleAddProduct = () => {
    if (!isVerified) {
      setShowVerifyModal(true);
      return;
    }
    go("add-product");
  };

  const confirmRemoval = async () => {
    try {
      await deleteProduct(pendingRemoval.id);
      setProductList((list) => list.filter((p) => p.id !== pendingRemoval.id));
      setError("");
    } catch (err) {
      setError(err.message);
    }
    setPendingRemoval(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(editing);
      setProductList((list) =>
        list.map((product) => (product.id === editing.id ? editing : product)),
      );
      setEditing(null);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (editing)
    return (
      <div>
        <button className="back-btn" onClick={() => setEditing(null)}>
          <ArrowLeft size={16} /> Back to products
        </button>
        <div className="form-card">
          <h2>Edit Product</h2>
          {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
          <form className="fields" onSubmit={saveEdit}>
            <label>
              Product Name
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <label>
              Price
              <input
                type="number"
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Stock Quantity
              <input
                type="number"
                value={editing.stock}
                onChange={(e) =>
                  setEditing({ ...editing, stock: Number(e.target.value) })
                }
              />
            </label>
            <button className="primary" type="submit">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    );

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>My Products</h1>
          <p>Manage your product listings and inventory.</p>
        </div>
        <button className="primary" onClick={handleAddProduct}>
          <Plus size={17} /> Add Product
        </button>
      </div>
      <div className="tabs">
        {["All", "Active", "Out of Stock", "Draft"].map((filter) => (
          <button
            key={filter}
            className={tab === filter ? "selected" : ""}
            onClick={() => setTab(filter)}
          >
            {filter} (
            {
              productList.filter((product) => matchesTab(product, filter))
                .length
            }
            )
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}
      {loading && <p style={{ fontSize: 13 }}>Loading products...</p>}

      <div className="seller-products">
        {visibleProducts.map((p) => (
          <div className="seller-product" key={p.id}>
            <ProductArt p={p} />
            <h3>{p.name}</h3>
            <strong>{money(p.price)}</strong>
            <small>Stock: {p.stock}</small>
            <span className="active-dot">
              {p.stock > 0 ? "● Active" : "● Out of Stock"}
            </span>
            <div className="product-actions">
              <button
                onClick={() => setEditing(p)}
                aria-label={`Edit ${p.name}`}
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setPendingRemoval(p)}
                aria-label={`Remove ${p.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {!loading && !visibleProducts.length && (
          <div className="empty">
            <Package size={32} />
            <h3>No products in this view</h3>
          </div>
        )}
        <button className="add-tile" onClick={handleAddProduct}>
          <Plus size={25} />
          <span>Add New Product</span>
        </button>
      </div>

      {pendingRemoval && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            display: "grid",
            placeItems: "center",
            background: "rgba(7,26,46,.45)",
            padding: 20,
          }}
        >
          <div
            className="form-card"
            role="dialog"
            aria-modal="true"
            style={{ width: "min(380px,100%)", margin: 0 }}
          >
            <h2>Remove product?</h2>
            <p style={{ color: "var(--muted)", fontSize: 12 }}>
              Are you sure you want to remove{" "}
              <strong>{pendingRemoval.name}</strong> from your products?
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 18,
              }}
            >
              <button
                className="outline"
                onClick={() => setPendingRemoval(null)}
              >
                Keep Product
              </button>
              <button
                className="primary"
                style={{ background: "#d94b58" }}
                onClick={confirmRemoval}
              >
                Remove Product
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerifyModal && (
        <VerificationRequiredModal
          status={status}
          onClose={() => setShowVerifyModal(false)}
          onGoToSettings={() => {
            setShowVerifyModal(false);
            go("settings");
          }}
        />
      )}
    </div>
  );
}
