import { useState } from "react";
import { Upload } from "lucide-react";
import { readImageFile } from "../utils/image";

export default function ImageUpload({
  label,
  value,
  onChange,
  error,
  disabled,
}) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setProblem("");
    try {
      onChange(await readImageFile(file));
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  };

  const message = problem || error;

  return (
    <div className="doc-field wide">
      <span className="doc-label">{label}</span>
      <label
        className={
          "doc-drop" + (value ? " filled" : "") + (message ? " invalid" : "")
        }
      >
        {value ?
          <img src={value} alt={`${label} preview`} />
        : <>
            <Upload size={24} />
            <b>{busy ? "Processing…" : "Click to upload a photo"}</b>
            <small>PNG, JPG or WebP · up to 5MB</small>
          </>
        }
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={pick}
          disabled={disabled || busy}
          hidden
        />
      </label>
      {value && !disabled && (
        <div className="doc-actions">
          <span>Click the image to replace it</span>
          <button
            type="button"
            className="text-btn danger"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        </div>
      )}
      {message && <small className="field-error">{message}</small>}
    </div>
  );
}
