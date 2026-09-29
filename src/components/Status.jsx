import "../styles/Status.css";

export default function Status({ children }) {
  const statusClass = String(children)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
  return <span className={`status ${statusClass}`}>{children}</span>;
}
