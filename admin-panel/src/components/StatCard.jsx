function StatCard({
  icon,
  title,
  value,
  change,
  type,
}) {
  return (
    <div className="stat-card">

      <div className={`stat-icon ${type}`}>
        {icon}
      </div>

      <div className="stat-info">

        <span>{title}</span>

        <h2>{value}</h2>

        <small className="stat-change">
          {change}
        </small>

      </div>

    </div>
  );
}

export default StatCard;