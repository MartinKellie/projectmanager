# AI Productivity OS

A personal operating system for managing outcome-based projects, tracking time intentionally, and receiving AI-assisted insights without surrendering authority to automation.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism theme
- **Storage**: Local Storage (browser-based, Firebase-ready architecture)
- **Future Backend**: Firebase (Auth, Firestore, Cloud Functions) - ready for migration
- **AI**: OpenAI via Cloud Functions proxy (future)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure Google Gemini API:
   - Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add it to `.env` as `NEXT_PUBLIC_GEMINI_API_KEY=your_key_here`
   - The app uses Gemini Nano (free tier) for AI-assisted planning

4. Run the development server:
```bash
npm run dev
```

**Note**: During early development, the app uses browser Local Storage. All data persists locally in your browser. The architecture is designed to easily migrate to Firebase later - just swap the storage layer.

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Cursor preview works, but your browser cannot reach it
If Cursor shows the app in its built-in browser but your normal browser says "site can't be reached", make sure you have started the real Next.js dev server from a terminal:

1. Run `npm run dev`
2. Use the URL Next prints (typically `http://localhost:3000`)

Cursor may also use its own internal preview port(s), which are not guaranteed to be reachable from your normal browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles with visual system
├── components/            # React components
│   └── layout/           # Layout components
├── lib/                  # Utilities and configurations
│   ├── storage/          # Local storage layer (Firebase-ready API)
│   └── utils/            # Helper functions
├── types/                # TypeScript type definitions
└── AI_Productivity_OS_Technical_Spec.md  # Full specification
```

## Architecture

### Three-Column Layout

1. **Left Column**: Utilities (Pomodoro timer, Music player, Settings)
2. **Middle Column**: Today/Focus (Daily intent, Next actions, AI suggestions)
3. **Right Column**: Project Radar (Project cards with health indicators)

### Data Models

- `users` - User accounts and settings
- `projects` - Project definitions with confidence scores
- `actions` - Next actions (project-bound or ad-hoc)
- `timeLogs` - Time tracking entries
- `dailyIntent` - Daily startup ritual
- `aiEvents` - AI insights, suggestions, praise, summaries
- `projectConfidenceHistory` - Confidence score change history

## Development Phases

### Phase 1 (Current)
- ✅ Project setup and architecture
- ✅ Local storage layer (Firebase-ready)
- ✅ Type definitions
- ✅ Layout structure
- ✅ Auth system (local storage)
- ⏳ Project CRUD UI
- ⏳ Time tracking
- ⏳ Next actions
- ⏳ Daily intent ritual

### Phase 2
- Financial logic
- Deadline risk calculation
- Confidence history
- Basic AI insights
- End-of-day summary

### Phase 3
- Conversational AI
- Praise engine
- Pattern summaries
- Music integration
- Visual polish

## Key Principles

- **AI observes, suggests, summarizes** - Never overrides user decisions
- **Manual control** - Confidence slider is user-only
- **Max 5 actions** - Hard cap on surfaced actions
- **System works without AI** - Core functionality independent

## License

Private project
