interface Props {
  level: number; // 1-10
}

const getColor = (level: number) => {
  if (level <= 3) return '#22c55e';
  if (level <= 6) return '#f59e0b';
  return '#ef4444';
};

export function FrustrationMeter({ level }: Props) {
  const pct = ((level - 1) / 9) * 100;
  const color = getColor(level);

  return (
    <div className="frustration-meter">
      <div className="frustration-meter__header">
        <span>Customer Patience</span>
        <span style={{ color }} className="frustration-meter__level">{level}/10</span>
      </div>
      <div className="frustration-meter__track">
        <div
          className="frustration-meter__fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="frustration-meter__labels">
        <span>Calm</span>
        <span>Frustrated</span>
      </div>
    </div>
  );
}
