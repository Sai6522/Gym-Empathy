// Web Speech API service

type RecognitionCallback = (transcript: string, isFinal: boolean) => void;

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export class SpeechService {
  private recognition: ISpeechRecognition | null = null;
  private synth = window.speechSynthesis;

  get isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  startListening(onResult: RecognitionCallback, onEnd: () => void): void {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (e: SpeechRecognitionEvent) => {
      const result = e.results[e.results.length - 1];
      onResult(result[0].transcript, result.isFinal);
    };
    this.recognition.onend = onEnd;
    this.recognition.onerror = onEnd;
    this.recognition.start();
  }

  stopListening(): void {
    this.recognition?.stop();
    this.recognition = null;
  }

  speak(text: string, onEnd?: () => void): void {
    this.synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    if (onEnd) utt.onend = onEnd;
    this.synth.speak(utt);
  }

  stopSpeaking(): void {
    this.synth.cancel();
  }
}

export const speechService = new SpeechService();
