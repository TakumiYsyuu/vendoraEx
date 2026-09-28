import "../styles/Status.css";

export default function Status({ children }) {
  // Convert any status text into a predictable CSS-safe modifier class.
  const statusClass = String(children)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  return <span className={`status ${statusClass}`}>{children}</span>;
}
