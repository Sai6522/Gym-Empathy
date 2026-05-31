import { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { CallInterface } from './components/CallInterface';
import { Scorecard } from './components/Scorecard';
import type { TranscriptEntry, Scorecard as ScorecardData } from './gemini';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

type Screen = 'setup' | 'call' | 'scorecard';

interface SessionData {
  persona: string;
  transcript: TranscriptEntry[];
  scorecard: ScorecardData;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [session, setSession] = useState<Partial<SessionData>>({});

  if (!API_KEY) {
    return (
      <div className="app">
        <div className="setup-card" style={{ maxWidth: 440 }}>
          <p style={{ color: 'var(--danger)', textAlign: 'center' }}>
            Missing <code>VITE_GEMINI_API_KEY</code> environment variable.
          </p>
        </div>
      </div>
    );
  }

  const handleStart = (persona: string) => {
    setSession({ persona });
    setScreen('call');
  };

  const handleCallEnd = (transcript: TranscriptEntry[], scorecard: ScorecardData) => {
    setSession((s) => ({ ...s, transcript, scorecard }));
    setScreen('scorecard');
  };

  const handleRestart = () => {
    setSession({});
    setScreen('setup');
  };

  return (
    <div className="app">
      {screen === 'setup' && <SetupScreen onStart={handleStart} />}
      {screen === 'call' && session.persona && (
        <CallInterface
          apiKey={API_KEY}
          persona={session.persona}
          onCallEnd={handleCallEnd}
        />
      )}
      {screen === 'scorecard' && session.scorecard && session.transcript && session.persona && (
        <Scorecard
          scorecard={session.scorecard}
          transcript={session.transcript}
          persona={session.persona}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
