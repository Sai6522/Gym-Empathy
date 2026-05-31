import { useState } from 'react';
import { Headphones, User } from 'lucide-react';
import { PERSONA_OPTIONS } from '../gemini';

interface Props {
  onStart: (persona: string) => void;
}

export function SetupScreen({ onStart }: Props) {
  const [persona, setPersona] = useState(PERSONA_OPTIONS[0].value);

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-card__logo">
          <Headphones size={40} />
        </div>
        <h1 className="setup-card__title">EmpathyGym</h1>
        <p className="setup-card__subtitle">Voice-first customer support training simulator</p>

        <div className="form-group">
          <label className="form-label">
            <User size={14} /> Customer Persona
          </label>
          <select
            className="form-input"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
          >
            {PERSONA_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn--primary" onClick={() => onStart(persona)}>
          Start Training Call
        </button>
      </div>
    </div>
  );
}
