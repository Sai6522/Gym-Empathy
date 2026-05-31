import { useState } from 'react';
import { Award, CheckCircle, RotateCcw, Save } from 'lucide-react';
import type { TranscriptEntry, Scorecard as ScorecardData } from '../gemini';
import { saveSession } from '../firebase';

interface Props {
  scorecard: ScorecardData;
  transcript: TranscriptEntry[];
  persona: string;
  onRestart: () => void;
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="score-ring">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="45" cy="45" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
        />
        <text x="45" y="50" textAnchor="middle" fill={color} fontSize="16" fontWeight="bold">
          {value}%
        </text>
      </svg>
      <span className="score-ring__label">{label}</span>
    </div>
  );
}

export function Scorecard({ scorecard, transcript, persona, onRestart }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await saveSession(persona, transcript, scorecard);
      setSaved(true);
    } catch {
      setSaveError('Save failed. Check Firebase config.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="scorecard">
      <div className="scorecard__header">
        <Award size={32} className="scorecard__icon" />
        <h2>Session Complete</h2>
        <p className="scorecard__summary">{scorecard.summary}</p>
      </div>

      <div className="scorecard__scores">
        <ScoreRing value={scorecard.empathyScore} label="Empathy" />
        <ScoreRing value={scorecard.clarityRating} label="Clarity" />
      </div>

      <div className="scorecard__recommendations">
        <h3>Key Recommendations</h3>
        <ul>
          {scorecard.recommendations.map((r, i) => (
            <li key={i}>
              <CheckCircle size={14} />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {saveError && <p className="scorecard__error">{saveError}</p>}

      <div className="scorecard__actions">
        <button className="btn btn--secondary" onClick={handleSave} disabled={saving || saved}>
          <Save size={14} />
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save to Firebase'}
        </button>
        <button className="btn btn--primary" onClick={onRestart}>
          <RotateCcw size={14} /> New Call
        </button>
      </div>
    </div>
  );
}
