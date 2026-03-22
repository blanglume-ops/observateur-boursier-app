export default function Sparkline({ history, width = 80, height = 24 }) {
  if (!history || history.length < 2) {
    return <svg width={width} height={height} />;
  }

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history.map((v, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const first = history[0];
  const last = history[history.length - 1];
  const colorClass = last >= first ? 'sparkline-up' : 'sparkline-down';

  // Area fill
  const areaPoints = `0,${height} ${polyline} ${width},${height}`;
  const fillColor = last >= first ? 'rgba(57,255,20,0.08)' : 'rgba(255,34,34,0.08)';
  const strokeColor = last >= first ? '#39ff14' : '#ff2222';

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polygon points={areaPoints} fill={fillColor} />
      <polyline
        points={polyline}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1"
        className={colorClass}
      />
      {/* Last price dot */}
      <circle
        cx={width}
        cy={height - ((last - min) / range) * (height - 2) - 1}
        r="2"
        fill={strokeColor}
      />
    </svg>
  );
}
