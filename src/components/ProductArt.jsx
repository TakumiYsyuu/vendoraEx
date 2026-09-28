import "../styles/ProductArt.css";

export default function ProductArt({ p, large = false }) {
  // Product media can come from an uploaded image or the fallback product icon.
  const renderProductMedia = () => {
    if (p.image)
      return (
        <img
          src={p.image}
          alt={p.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      );
    return <span>{p.icon}</span>;
  };

  return (
    <div
      className={"product-art " + (large ? "large" : "")}
      style={{ background: p.bg }}
    >
      {renderProductMedia()}
    </div>
  );
}
