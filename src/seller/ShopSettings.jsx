import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { initials } from "../utils/helpers";
import Verification from "./Verification";
import { getShopProfile, updateShopProfile } from "../logic/verification";

export default function ShopSettings({ user, onUpdate }) {
  const [shop, setShop] = useState({
    name: user.shopName || `${user.name}'s Shop`,
    email: user.shopEmail || user.email,
    description: user.shopDescription || "NONE",
    address: user.address || "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getShopProfile()
      .then((p) => {
        if (!active) return;
        setShop({
          name: p.name,
          email: p.email,
          description: p.description,
          address: p.address ?? "",
        });
      })
      .catch(() => {
        /* keep the values from `user` if the request fails */
      });
    return () => {
      active = false;
    };
  }, []);

  const [fieldErrors, setFieldErrors] = useState({});

  const update = (e) => {
    setShop({ ...shop, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    setSaved(false);
    setError("");
  };

  const validate = () => {
    const errs = {};
    const name = shop.name.trim();
    if (!name) errs.name = "Shop name is required.";
    else if (name.length < 2)
      errs.name = "Shop name must be at least 2 characters.";
    else if (name.length > 100)
      errs.name = "Shop name must be 100 characters or less.";
    if (shop.description.trim().length > 500)
      errs.description = "Description must be 500 characters or less.";
    if (!shop.address.trim()) errs.address = "Address is required.";
    return errs;
  };

  const save = async (e) => {
    e.preventDefault();
    const found = validate();
    setFieldErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await updateShopProfile({
        name: shop.name.trim(),
        description: shop.description.trim(),
        address: shop.address.trim(),
      });
      onUpdate?.({
        shopName: shop.name.trim(),
        shopEmail: shop.email,
        shopDescription: shop.description.trim(),
        address: shop.address.trim(),
      });
      setError("");
      setSaved(true);
    } catch (err) {
      setError(err.message);
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Shop Settings</h1>
          <p>Manage your store profile and verification.</p>
        </div>
      </div>

      <div className="settings-stack">
        <form className="form-card" onSubmit={save}>
          <div className="section-head">
            <h2>Shop Profile</h2>
          </div>
          <div className="settings-avatar">{initials(shop.name)}</div>
          <div className="fields">
            <label>
              Shop Name
              <input
                name="name"
                value={shop.name}
                onChange={update}
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name && (
                <small className="field-error">{fieldErrors.name}</small>
              )}
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                value={shop.email}
                readOnly
                tabIndex={-1}
              />
              <small>Your registered email can't be changed.</small>
            </label>
            <label className="wide">
              Address
              <input
                name="address"
                value={shop.address}
                onChange={update}
                maxLength={255}
                placeholder="Street, barangay, city, province"
                autoComplete="street-address"
                aria-invalid={!!fieldErrors.address}
              />
              {fieldErrors.address && (
                <small className="field-error">{fieldErrors.address}</small>
              )}
            </label>
            <label className="wide">
              Shop Description
              <textarea
                name="description"
                value={shop.description}
                onChange={update}
                aria-invalid={!!fieldErrors.description}
              />
              {fieldErrors.description && (
                <small className="field-error">{fieldErrors.description}</small>
              )}
            </label>
          </div>
          <div className="settings-actions">
            <button className="primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {saved && (
              <span className="saved-note">
                <CheckCircle2 size={16} /> Changes saved
              </span>
            )}
            {error && <small className="field-error">{error}</small>}
          </div>
        </form>

        <Verification />
      </div>
    </div>
  );
}
