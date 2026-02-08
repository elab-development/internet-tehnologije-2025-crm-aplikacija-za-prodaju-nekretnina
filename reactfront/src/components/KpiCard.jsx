import React, { useEffect, useRef, useState } from "react";

function formatValue(n, { suffix = "", prefix = "", decimals = 0 } = {}) {
  const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  const pretty = fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${prefix}${pretty}${suffix}`;
}

function useInViewOnce(options = { threshold: 0.25 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        obs.disconnect();
      }
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, options]);

  return { ref, inView };
}

function useCountUp(target, startWhen, { duration = 900 } = {}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!startWhen) return;

    let rafId = 0;
    const start = performance.now();
    const from = 0;
    const to = Number(target) || 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(from + (to - from) * eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, startWhen, duration]);

  return val;
}

export default function KpiCard({
  icon,
  title,
  value,
  hint,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 900,
  className = "",
}) {
  const { ref, inView } = useInViewOnce({ threshold: 0.25 });
  const animated = useCountUp(value, inView, { duration });

  return (
    <div ref={ref} className={`crm-kpi ${className}`.trim()}>
      <div className="crm-kpi-ic">{icon}</div>
      <div className="crm-kpi-main">
        <div className="crm-kpi-title">{title}</div>
        <div className="crm-kpi-value">
          {formatValue(animated, { prefix, suffix, decimals })}
        </div>
        <div className="crm-kpi-hint">{hint}</div>
      </div>
    </div>
  );
}
