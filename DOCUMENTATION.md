# EmpathyGym — Product Documentation

## What Is EmpathyGym?

EmpathyGym is a **voice-first customer support training simulator** that runs entirely in the browser. A trainee speaks to an AI-powered customer persona in real time, receives live feedback on the customer's frustration level, and gets a scored performance report at the end of every session — all without any backend server or subscription cost.

---

## The Problem It Solves

Traditional customer support training relies on:
- Role-play with a human trainer (expensive, hard to scale)
- Reading manuals and watching videos (passive, no practice)
- Live calls with real customers (high risk for new agents)

EmpathyGym replaces all three with an **always-available, judgment-free practice environment** where agents can fail safely, learn from mistakes, and build empathy muscle memory before ever touching a real customer.

---

## Use Cases

### 1. New Agent Onboarding
A call centre hires 20 new agents. Instead of pairing each with a senior trainer for role-play, every agent independently completes 10 EmpathyGym sessions covering different personas before their first live call. Training time drops from days to hours.

### 2. Empathy Skill Remediation
A QA team flags an agent whose CSAT scores are consistently low. The manager assigns specific EmpathyGym personas that mirror the agent's weak spots (e.g., "Repeat Caller — Billing Error"). The agent practices until their Empathy Score consistently exceeds 75%.

### 3. Product Launch Preparation
A company is launching a new product and expects a surge of confused or frustrated callers. Support leads create custom personas matching anticipated complaint types and run the whole team through targeted sessions the week before launch.

### 4. Self-Directed Continuous Learning
Experienced agents use EmpathyGym on their own to sharpen skills, try harder difficulty personas, and compete on the leaderboard — turning skill development into a habit rather than a one-time event.

### 5. Remote / Distributed Teams
Teams spread across time zones can train asynchronously. No trainer needs to be online. Sessions are logged to Firestore so managers can review scores and transcripts at any time.

---

## Key Benefits

| Benefit | Detail |
|---|---|
| **Zero cost to run** | Browser-native speech APIs + Gemini free tier + Firebase free tier = $0/month |
| **Instant feedback** | Frustration meter updates after every agent response, not just at the end |
| **Safe to fail** | Agents can hang up, restart, and try again with no real-world consequences |
| **Scalable** | 1 agent or 1,000 agents — no infrastructure to provision |
| **Objective scoring** | AI-generated scores remove trainer bias |
| **Async & self-paced** | No scheduling, no waiting for a trainer |

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        SETUP SCREEN                         │
│                                                             │
│   Select Customer Persona                                   │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  • Frustrated Senior — Account Locked               │  │
│   │  • Irate Buyer — Missing Package                    │  │
│   │  • Confused Business Owner — Software Down          │  │
│   │  • Repeat Caller — Billing Error                    │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│              [ Start Training Call ]                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       CALL INTERFACE                        │
│                                                             │
│  ┌─────────────────────┐   ┌───────────────────────────┐   │
│  │  Frustration Meter  │   │     Live Transcript        │   │
│  │  ████░░░░░░  6/10   │   │  Customer: "I've been      │   │
│  └─────────────────────┘   │  waiting 3 days and..."   │   │
│                            │  You: "I completely        │   │
│  ┌─────────────────────┐   │  understand, let me..."   │   │
│  │   Audio Waveform    │   └───────────────────────────┘   │
│  │  ▁▃▅▇▅▃▁▃▅▇▅▃▁     │                                    │
│  └─────────────────────┘                                    │
│                                                             │
│              ┌───────┐   ┌──────────┐                      │
│              │  🎤   │   │ End Call │                      │
│              │ Speak │   └──────────┘                      │
│              └───────┘                                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
              ▼                            ▼
   Frustration hits 1              Frustration hits 10
   (Customer calmed down)          (Customer hangs up)
              │                            │
              └─────────────┬──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        SCORECARD                            │
│                                                             │
│         Empathy Score        Clarity Rating                 │
│           ◉ 82%                ◉ 74%                        │
│                                                             │
│  Key Recommendations:                                       │
│  ✓ Acknowledge feelings before offering solutions          │
│  ✓ Avoid technical jargon with senior customers            │
│  ✓ Confirm understanding before closing the call           │
│                                                             │
│   [ Save to Firebase ]    [ New Call ]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                         │
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐  │
│  │  React UI   │◄──►│   App.tsx    │◄──►│   gemini.ts        │  │
│  │  Components │    │ State Router │    │ GeminiService      │  │
│  │             │    │              │    │ - startSession()   │  │
│  │ SetupScreen │    │  screen:     │    │ - sendMessage()    │  │
│  │ CallInterface    │  setup │     │    │ - generateScore()  │  │
│  │ Scorecard   │    │  call  │     │    └────────┬───────────┘  │
│  │ Waveform    │    │  score │     │             │              │
│  │ Frustration │    └──────────────┘             │ HTTPS        │
│  │ Transcript  │                                 │              │
│  └──────┬──────┘    ┌──────────────┐             │              │
│         │           │  speech.ts   │             │              │
│         │           │ SpeechService│             │              │
│         │           │ - startListen│             │              │
│         │           │ - speak()    │             │              │
│         │           └──────┬───────┘             │              │
│         │                  │                     │              │
│         │           ┌──────┴───────┐             │              │
│         │           │  Web Speech  │             │              │
│         │           │     API      │             │              │
│         │           │ (browser     │             │              │
│         │           │  native)     │             │              │
│         │           └──────────────┘             │              │
│         │                                        │              │
│         │           ┌──────────────┐             │              │
│         └──────────►│  firebase.ts │             │              │
│                     │ saveSession()│             │              │
│                     └──────┬───────┘             │              │
└────────────────────────────┼─────────────────────┼──────────────┘
                             │                     │
                             ▼                     ▼
                   ┌──────────────────┐  ┌──────────────────────┐
                   │    Firebase      │  │   Google Gemini API   │
                   │    Firestore     │  │   gemini-2.5-flash    │
                   │  (free tier)     │  │   (free tier)         │
                   │                  │  │                       │
                   │  sessions/       │  │  • Acts as customer   │
                   │  ├── transcript  │  │    persona            │
                   │  ├── scorecard   │  │  • Returns JSON:      │
                   │  ├── persona     │  │    frustrationLevel   │
                   │  └── createdAt   │  │    responseText       │
                   └──────────────────┘  └──────────────────────┘
```

---

## Data Flow — Single Turn

```
Agent presses [ Speak ]
        │
        ▼
Web Speech Recognition (browser)
  → Converts voice to text in real time
  → Interim results shown in transcript
        │
        ▼ (final transcript)
GeminiService.sendMessage(agentText)
  → Sends full conversation history + agent's latest message
  → Gemini responds as the customer persona
  → Returns: { responseText: string, frustrationLevel: 1-10 }
        │
        ├──► FrustrationMeter updates visually
        ├──► Transcript appends customer response
        │
        ▼
speechSynthesis.speak(responseText)
  → Browser reads the customer's response aloud
        │
        ▼
frustrationLevel check:
  ≤ 1  → generateScorecard() → Scorecard screen  (success)
  ≥ 10 → generateScorecard() → Scorecard screen  (failure)
  else → Agent presses [ Speak ] again            (continue)
```

---

## Scoring Rubric (AI-Generated)

At session end, the full transcript is sent to Gemini with this evaluation prompt:

| Metric | What It Measures |
|---|---|
| **Empathy Score (0–100%)** | Did the agent acknowledge feelings, apologise sincerely, and validate the customer's frustration? |
| **Clarity Rating (0–100%)** | Were responses clear, jargon-free, and solution-focused? |
| **Recommendations** | 3 specific, actionable coaching tips based on the actual transcript |

---

## Tech Stack Summary

| Layer | Technology | Cost |
|---|---|---|
| UI Framework | React 18 + TypeScript + Vite | Free |
| Styling | Custom CSS (dark theme) | Free |
| Icons | Lucide React | Free |
| Speech-to-Text | Web Speech API (`webkitSpeechRecognition`) | Free (browser native) |
| Text-to-Speech | Web Speech API (`speechSynthesis`) | Free (browser native) |
| AI Reasoning | Google Gemini 2.5 Flash | Free tier (1,500 req/day) |
| Database | Firebase Firestore | Free tier (50k reads/day) |
| Hosting | Vercel / Netlify / Firebase Hosting | Free |

**Total monthly cost: $0**

---

## Deployment

### Vercel / Netlify
1. Push repo to GitHub
2. Connect repo in Vercel/Netlify dashboard
3. Set environment variable: `VITE_GEMINI_API_KEY=your_key`
4. Build command: `npm run build` · Output: `dist`

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # public dir: dist, SPA: yes
npm run build
firebase deploy
```

---

## Future Enhancements

- **Custom personas** — managers define their own customer scenarios
- **Leaderboard** — team rankings by empathy score pulled from Firestore
- **Session replay** — play back the audio + transcript of any saved session
- **Multilingual support** — Web Speech API supports 50+ languages
- **Manager dashboard** — aggregate scores and trends across the team
