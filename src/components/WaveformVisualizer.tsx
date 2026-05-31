interface Props {
  active: boolean;
}

export function WaveformVisualizer({ active }: Props) {
  return (
    <div className="waveform" aria-label="Audio waveform">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className={`waveform-bar ${active ? 'waveform-bar--active' : ''}`}
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}
