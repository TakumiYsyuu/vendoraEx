export default function Stat({ title, value, trend, note }) {
  return (
    <div className="stat">
      <span>{title}</span>
      <strong>{value}</strong>
      <b className={trend.includes("attention") ? "warn" : ""}>{trend}</b>
      <small>{note}</small>
    </div>
  );
}
