import { ArrowLeft, Flag, Package } from "lucide-react";
import ProductGrid from "./ProductGrid";

export default function SellerStore({
  seller,
  products,
  openProduct,
  add,
  onReport,
}) {
  return (
    <div>
      <button className="back-btn" onClick={() => window.history.back()}>
        <ArrowLeft size={16} /> Back
      </button>
      <div className="page-title">
        <div>
          <h1>{seller}</h1>
          <p>Seller shop and available products</p>
        </div>
        <button className="outline small" onClick={onReport}>
          <Flag size={14} /> Report Shop
        </button>
      </div>
      <ProductGrid products={products} openProduct={openProduct} add={add} />
      {!products.length && (
        <div className="empty">
          <Package size={32} />
          <h3>This shop has no available products</h3>
        </div>
      )}
    </div>
  );
}
