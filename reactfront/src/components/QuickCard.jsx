import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

export default function QuickCard({
  title,
  desc,
  cta,
  to,
  icon,
  disabled = false,
  className = "",
}) {
  const cls = `${disabled ? "agentdash-card is-disabled" : "agentdash-card"} ${className}`.trim();

  const Inner = (
    <>
      <div className="agentdash-card-ic">{icon}</div>
      <div className="agentdash-card-title">{title}</div>
      <div className="agentdash-card-desc">{desc}</div>
      <div className="agentdash-card-cta">
        <span>{cta}</span>
        <FiArrowRight />
      </div>
    </>
  );

  if (disabled) return <div className={cls}>{Inner}</div>;

  return (
    <Link className={cls} to={to}>
      {Inner}
    </Link>
  );
}
