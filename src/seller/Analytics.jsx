import Stat from "./Stat";

export default function Analytics() {
  return (
    <div>
      <div className="page-title">
        <div>
          <h1>Analytics</h1>
          <p>Understand your store performance.</p>
        </div>
      </div>
      <div className="stats">
        <Stat title="Sales" value="₱12,480" trend="+12%" note="last 7 days" />
        <Stat title="Orders" value="18" trend="+20%" note="last 7 days" />
        <Stat
          title="Conversion"
          value="4.8%"
          trend="+0.6%"
          note="vs. last period"
        />
        <Stat title="Visitors" value="1,284" trend="+16%" note="last 7 days" />
      </div>
      <div className="chart-card">
        <h2>Sales Overview</h2>
        <div className="chart">
          <div className="chart-line"></div>
          {[12, 38, 28, 55, 45, 70, 64, 88, 78, 96].map((h, i) => (
            <i key={i} style={{ height: h + "%" }} />
          ))}
        </div>
        <div className="chart-labels">
          <span>Apr 20</span>
          <span>Apr 22</span>
          <span>Apr 24</span>
          <span>Apr 26</span>
        </div>
      </div>
    </div>
  );
}
