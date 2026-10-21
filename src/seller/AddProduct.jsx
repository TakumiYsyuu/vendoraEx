import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { money } from "../utils/helpers";
import { createProduct } from "../logic/products";
import VerificationRequiredModal from "./VerificationRequiredModal";
import useVerificationStatus from "../logic/useVerificationStatus";

const ERROR_STYLE = {
  display: "block",
  marginTop: 5,
  color: "#dc2626",
  fontSize: 11,
};
const errorBorder = (msg) => (msg ? { borderColor: "#dc2626" } : undefined);

export default function AddProduct({ go }) {
  const { status, loading, isVerified } = useVerificationStatus();
  const [product, setProduct] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    stock: "",
    discount: "",
  });
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const readImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrors({
        ...errors,
        image: "Only PNG, JPG or WebP images are allowed.",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: "Image must be 5MB or smaller." });
      return;
    }
    setErrors({ ...errors, image: "" });
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    const name = product.name.trim();
    const description = product.description.trim();
    const price = Number(product.price);
    const stock = Number(product.stock);
    const discount = product.discount === "" ? 0 : Number(product.discount);

    if (!name) e.name = "Product name is required.";
    else if (name.length < 3)
      e.name = "Product name must be at least 3 characters.";

    if (!product.category) e.category = "Please choose a category.";

    if (!description) e.description = "Please describe your product.";
    else if (description.length < 10)
      e.description = "Description must be at least 10 characters.";

    if (product.price === "") e.price = "Price is required.";
    else if (!(price > 0)) e.price = "Price must be greater than 0.";

    if (product.stock === "") e.stock = "Stock quantity is required.";
    else if (!Number.isInteger(stock) || stock < 0)
      e.stock = "Stock must be a whole number (0 or more).";

    if (!(discount >= 0 && discount < 100))
      e.discount = "Discount must be between 0 and 99.";

    if (!imageFile) e.image = "Please upload at least one product image.";

    return e;
  };

  const save = async (ev) => {
    ev.preventDefault();
    setServerError("");
    if (!isVerified) return; // safety net, the form isn't shown anyway

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await createProduct(
        {
          name: product.name.trim(),
          category: product.category,
          description: product.description.trim(),
          price: Number(product.price),
          stock: Number(product.stock),
          discount: product.discount === "" ? 0 : Number(product.discount),
        },
        [imageFile],
      );
      go("products");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const discountPercent = Number(product.discount) || 0;
  const originalPrice =
    discountPercent > 0 && Number(product.price) > 0 ?
      Math.round(Number(product.price) / (1 - discountPercent / 100))
    : Number(product.price) || 0;
  const savings = Math.max(0, originalPrice - (Number(product.price) || 0));

  /* ---------- Verification gate ---------- */
  if (loading) return <p style={{ padding: 20 }}>Loading…</p>;

  if (!isVerified) {
    return (
      <VerificationRequiredModal
        status={status}
        onClose={() => go("products")}
        onGoToSettings={() => go("settings")} // use the same key your sidebar uses for Shop Settings
      />
    );
  }

  return (
    <div>
      <button className="back-btn" onClick={() => go("products")}>
        <ArrowLeft size={16} /> My Products
      </button>
      <div className="page-title">
        <div>
          <h1>Add New Product</h1>
          <p>Create a listing for your store.</p>
        </div>
      </div>

      <form onSubmit={save} noValidate>
        <div className="form-grid">
          <div className="form-card">
            <h2>Product Images</h2>
            <label
              className="upload"
              style={{
                cursor: "pointer",
                overflow: "hidden",
                ...(errors.image ? { borderColor: "#dc2626" } : {}),
              }}
            >
              {image ?
                <img
                  src={image}
                  alt="Product preview"
                  style={{ width: "100%", height: 130, objectFit: "contain" }}
                />
              : <>
                  <span style={{ fontSize: 24 }}>▧</span>
                  <b>Click to upload an image</b>
                  <small>PNG, JPG up to 5MB</small>
                </>
              }
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={readImage}
                style={{ display: "none" }}
              />
            </label>
            {errors.image && <small style={ERROR_STYLE}>{errors.image}</small>}
          </div>

          <div className="form-card">
            <h2>Basic Information</h2>
            <div className="fields">
              <label>
                Product Name
                <input
                  name="name"
                  value={product.name}
                  onChange={update}
                  placeholder="Enter product name"
                  style={errorBorder(errors.name)}
                />
                {errors.name && (
                  <small style={ERROR_STYLE}>{errors.name}</small>
                )}
              </label>
              <label>
                Category
                <select
                  name="category"
                  value={product.category}
                  onChange={update}
                  style={errorBorder(errors.category)}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home & Living</option>
                  <option>Beauty & Health</option>
                  <option>Sports & Outdoors</option>
                  <option>Toys & Games</option>
                  <option>Groceries</option>
                  <option>Others</option>
                </select>
                {errors.category && (
                  <small style={ERROR_STYLE}>{errors.category}</small>
                )}
              </label>
              <label className="wide">
                Description
                <textarea
                  name="description"
                  value={product.description}
                  onChange={update}
                  placeholder="Tell us about your product..."
                  style={errorBorder(errors.description)}
                />
                {errors.description && (
                  <small style={ERROR_STYLE}>{errors.description}</small>
                )}
              </label>
            </div>
          </div>

          <div className="form-card">
            <h2>Pricing & Inventory</h2>
            <div className="fields three">
              <label>
                Price
                <input
                  name="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={product.price}
                  onChange={update}
                  placeholder="₱ 0.00"
                  style={errorBorder(errors.price)}
                />
                {errors.price && (
                  <small style={ERROR_STYLE}>{errors.price}</small>
                )}
              </label>
              <label>
                Stock Quantity
                <input
                  name="stock"
                  type="number"
                  min="0"
                  value={product.stock}
                  onChange={update}
                  placeholder="Enter quantity"
                  style={errorBorder(errors.stock)}
                />
                {errors.stock && (
                  <small style={ERROR_STYLE}>{errors.stock}</small>
                )}
              </label>
              <label>
                Discount (%)
                <input
                  name="discount"
                  type="number"
                  min="0"
                  max="99"
                  value={product.discount}
                  onChange={update}
                  placeholder="e.g. 20"
                  style={errorBorder(errors.discount)}
                />
                {errors.discount ?
                  <small style={ERROR_STYLE}>{errors.discount}</small>
                : <small
                    style={{
                      display: "block",
                      marginTop: 5,
                      color: "var(--muted)",
                      fontSize: 10,
                    }}
                  >
                    Enter 20 for 20% off
                  </small>
                }
              </label>
            </div>
            {discountPercent > 0 && (
              <p
                style={{
                  margin: "12px 0 0",
                  color: "var(--green)",
                  fontSize: 12,
                }}
              >
                Customer saves {money(savings)} ({discountPercent}% off).
                Original price: {money(originalPrice)}.
              </p>
            )}
          </div>
        </div>

        {serverError && (
          <p style={{ color: "#dc2626", fontSize: 13, margin: "12px 0 0" }}>
            {serverError}
          </p>
        )}
        {Object.values(errors).some(Boolean) && (
          <p style={{ color: "#dc2626", fontSize: 13, margin: "12px 0 0" }}>
            Please fix the highlighted fields before saving.
          </p>
        )}

        <div className="form-actions">
          <button
            className="outline"
            type="button"
            onClick={() => go("products")}
          >
            Cancel
          </button>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
