import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';

export interface CustomerResponse {
  responseText: string;
  frustrationLevel: number; // 1-10
}

export interface Scorecard {
  empathyScore: number;       // 0-100
  clarityRating: number;      // 0-100
  recommendations: string[];
  summary: string;
}

export interface TranscriptEntry {
  role: 'agent' | 'customer';
  text: string;
}

const PERSONAS: Record<string, string> = {
  'frustrated-senior': `You are Margaret, a 68-year-old retiree. Your online banking account has been locked for 3 days and you cannot access your pension funds. You are very frustrated and slightly confused by technical jargon. Speak in short, anxious sentences.`,
  'irate-buyer': `You are Jake, a 35-year-old professional. You ordered a birthday gift that never arrived, and the birthday was yesterday. You are furious and feel let down. You speak bluntly and demand immediate action.`,
  'confused-tech': `You are Linda, a 45-year-old small business owner. Your point-of-sale software stopped working during peak hours and you lost sales. You are stressed, speak quickly, and keep interrupting.`,
  'repeat-caller': `You are David, a 50-year-old who has called support 4 times about the same billing error. You are exhausted and deeply skeptical that anything will be fixed. You are passive-aggressive and sarcastic.`,
};

const SYSTEM_PROMPT = (persona: string) => `
${PERSONAS[persona] ?? PERSONAS['frustrated-senior']}

RULES:
- Stay fully in character throughout the conversation.
- Track your own frustration internally. Start at frustration level 6.
- Decrease frustration (min 1) when the agent shows genuine empathy, apologizes sincerely, or offers concrete solutions.
- Increase frustration (max 10) when the agent is dismissive, uses jargon, or fails to address your concern.
- ALWAYS respond with valid JSON only, no markdown, no extra text:
  {"responseText": "<your spoken response>", "frustrationLevel": <number 1-10>}
`;

function extractJSON(raw: string): string {
  // Strip <think>...</think> blocks (Gemini 2.5 reasoning)
  raw = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  // Strip markdown code fences
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  // Extract first JSON object
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) return match[0];
  return raw;
}
export class GeminiService {
  private chat: ChatSession | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  startSession(persona: string): void {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT(persona),
    });
    this.chat = model.startChat();
  }

  async sendMessage(agentText: string): Promise<CustomerResponse> {
    if (!this.chat) throw new Error('Session not started');
    const result = await this.chat.sendMessage(agentText);
    const raw = result.response.text().trim();
    try {
      return JSON.parse(extractJSON(raw)) as CustomerResponse;
    } catch {
      return { responseText: raw, frustrationLevel: 5 };
    }
  }

  async generateScorecard(transcript: TranscriptEntry[]): Promise<Scorecard> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const transcriptText = transcript
      .map((e) => `${e.role.toUpperCase()}: ${e.text}`)
      .join('\n');

    const prompt = `You are a customer support training evaluator. Analyze this support call transcript and return ONLY valid JSON (no markdown):
{
  "empathyScore": <0-100>,
  "clarityRating": <0-100>,
  "recommendations": ["<tip1>", "<tip2>", "<tip3>"],
  "summary": "<2-sentence overall assessment>"
}

TRANSCRIPT:
${transcriptText}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    try {
      return JSON.parse(extractJSON(raw)) as Scorecard;
    } catch {
      throw new Error('Failed to parse scorecard');
    }
  }
}

export const PERSONA_OPTIONS = [
  { value: 'frustrated-senior', label: 'Frustrated Senior — Account Locked' },
  { value: 'irate-buyer', label: 'Irate Buyer — Missing Package' },
  { value: 'confused-tech', label: 'Confused Business Owner — Software Down' },
  { value: 'repeat-caller', label: 'Repeat Caller — Billing Error' },
];
