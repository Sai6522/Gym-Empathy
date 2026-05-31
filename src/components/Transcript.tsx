import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '../gemini';

interface Props {
  entries: TranscriptEntry[];
  interim?: string;
}

export function Transcript({ entries, interim }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, interim]);

  return (
    <div className="transcript" role="log" aria-live="polite">
      {entries.map((e, i) => (
        <div key={i} className={`transcript__entry transcript__entry--${e.role}`}>
          <span className="transcript__label">{e.role === 'agent' ? 'You' : 'Customer'}</span>
          <p className="transcript__text">{e.text}</p>
        </div>
      ))}
      {interim && (
        <div className="transcript__entry transcript__entry--agent transcript__entry--interim">
          <span className="transcript__label">You</span>
          <p className="transcript__text">{interim}…</p>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
