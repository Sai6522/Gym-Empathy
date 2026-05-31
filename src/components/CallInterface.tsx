import { useState, useCallback, useRef } from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { FrustrationMeter } from './FrustrationMeter';
import { Transcript } from './Transcript';
import { speechService } from '../speech';
import { GeminiService } from '../gemini';
import type { TranscriptEntry, Scorecard } from '../gemini';
import { PERSONA_OPTIONS } from '../gemini';

interface Props {
  apiKey: string;
  persona: string;
  onCallEnd: (transcript: TranscriptEntry[], scorecard: Scorecard) => void;
}

type CallState = 'idle' | 'listening' | 'processing' | 'speaking';

export function CallInterface({ apiKey, persona, onCallEnd }: Props) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [frustration, setFrustration] = useState(6);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');

  const geminiRef = useRef<GeminiService | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);

  const personaLabel = PERSONA_OPTIONS.find((p) => p.value === persona)?.label ?? persona;

  // Initialize Gemini session on first mic press
  const ensureSession = useCallback(() => {
    if (!geminiRef.current) {
      geminiRef.current = new GeminiService(apiKey);
      geminiRef.current.startSession(persona);
    }
  }, [apiKey, persona]);

  const addEntry = (entry: TranscriptEntry) => {
    transcriptRef.current = [...transcriptRef.current, entry];
    setTranscript([...transcriptRef.current]);
  };

  const handleEndCall = useCallback(async (finalFrustration: number) => {
    speechService.stopListening();
    speechService.stopSpeaking();
    setCallState('processing');
    try {
      const scorecard = await geminiRef.current!.generateScorecard(transcriptRef.current);
      onCallEnd(transcriptRef.current, scorecard);
    } catch {
      setError('Failed to generate scorecard. Please try again.');
      setCallState('idle');
    }
  }, [onCallEnd]);

  const handleFinalTranscript = useCallback(async (text: string) => {
    setInterim('');
    if (!text.trim()) { setCallState('idle'); return; }

    addEntry({ role: 'agent', text });
    setCallState('processing');

    try {
      const response = await geminiRef.current!.sendMessage(text);
      setFrustration(response.frustrationLevel);
      addEntry({ role: 'customer', text: response.responseText });

      // Check end conditions
      if (response.frustrationLevel <= 1) {
        setCallState('speaking');
        speechService.speak(response.responseText, () => handleEndCall(response.frustrationLevel));
        return;
      }
      if (response.frustrationLevel >= 10) {
        setCallState('speaking');
        speechService.speak(response.responseText, () => handleEndCall(response.frustrationLevel));
        return;
      }

      setCallState('speaking');
      speechService.speak(response.responseText, () => setCallState('idle'));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI error. Check your API key.');
      setCallState('idle');
    }
  }, [handleEndCall]);

  const startListening = useCallback(() => {
    if (!speechService.isSupported) {
      setError('Speech recognition not supported in this browser. Use Chrome.');
      return;
    }
    ensureSession();
    setError('');
    setCallState('listening');
    speechService.startListening(
      (text, isFinal) => {
        if (isFinal) handleFinalTranscript(text);
        else setInterim(text);
      },
      () => { if (callState === 'listening') setCallState('idle'); }
    );
  }, [ensureSession, handleFinalTranscript, callState]);

  const stopListening = useCallback(() => {
    speechService.stopListening();
    setCallState('idle');
    setInterim('');
  }, []);

  const isListening = callState === 'listening';
  const isBusy = callState === 'processing' || callState === 'speaking';

  return (
    <div className="call-interface">
      <div className="call-interface__header">
        <div className="call-interface__persona">
          <span className="call-interface__persona-dot" />
          <span>{personaLabel}</span>
        </div>
        <button
          className="btn btn--danger btn--sm"
          onClick={() => handleEndCall(frustration)}
          disabled={transcript.length === 0}
        >
          <PhoneOff size={14} /> End Call
        </button>
      </div>

      <FrustrationMeter level={frustration} />

      <WaveformVisualizer active={isListening} />

      <Transcript entries={transcript} interim={interim} />

      {error && <p className="call-interface__error">{error}</p>}

      <div className="call-interface__controls">
        {isListening ? (
          <button className="btn btn--mic btn--mic--active" onClick={stopListening}>
            <MicOff size={24} />
            <span>Stop</span>
          </button>
        ) : (
          <button
            className="btn btn--mic"
            onClick={startListening}
            disabled={isBusy}
          >
            <Mic size={24} />
            <span>{isBusy ? (callState === 'processing' ? 'Thinking…' : 'Speaking…') : 'Speak'}</span>
          </button>
        )}
      </div>

      <p className="call-interface__hint">
        {callState === 'idle' && transcript.length === 0 && 'Press Speak to begin the call'}
        {callState === 'idle' && transcript.length > 0 && 'Press Speak to respond'}
        {isListening && 'Listening… speak now'}
        {callState === 'processing' && 'Customer is thinking…'}
        {callState === 'speaking' && 'Customer is speaking…'}
      </p>
    </div>
  );
}
