# StudySet

An AI-powered academic study tool built with Next.js and Claude AI. StudySet creates personalized, syllabus-aware learning experiences through intelligent tutoring, flashcards, quizzes, practice drills, and video recommendations.

## Features

### AI Tutoring
Chat with an AI tutor that understands your course syllabus. Conversations are context-aware and adapt to your preferred difficulty level and response length. The tutor can generate inline practice problems and step-by-step drills during conversations.

### Flashcards with Spaced Repetition
Create flashcards manually or generate them with AI based on your syllabus. The system uses the SM-2 spaced repetition algorithm to schedule reviews, tracking ease factor, interval, and repetition count for each card. Cards are surfaced when they're due, and ratings (Again, Hard, Good, Easy) adjust future scheduling.

### Quiz Mode
Generate quizzes from your syllabus content with configurable question types (multiple choice, free response, or mixed) and question counts (5, 10, or 15). Navigate questions one at a time, get immediate scoring with detailed review, and track past quiz history.

### Practice Drills
Step-by-step guided problem solving with locked/active/answered states for each step. Includes hints, answer reveals, and a progress bar. Drills are generated inline during AI tutoring conversations.

### Video Recommendations
AI-curated YouTube video recommendations relevant to your course topics. Includes channel names, descriptions, and direct YouTube search links.

### Syllabus Parsing
Upload a course syllabus as a PDF. The app extracts text using the Reducto API and uses it to contextualize all AI-generated content across tutoring, flashcards, quizzes, and drills.

### Study Settings
Per-user preferences for difficulty level (easy, medium, hard), response length (concise, detailed), and whether practice problems are included in tutor responses.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Auth & Database | Supabase |
| AI | Anthropic Claude API (claude-haiku-4-5) |
| PDF Parsing | Reducto API |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm |

## Project Structure

```
app/
  api/
    chat/                # AI tutoring endpoint
    generate-quiz/       # Quiz generation
    generate-flashcards/ # Flashcard generation
    parse-syllabus/      # PDF parsing via Reducto
  auth/
    login/               # Email/password login
    signup/              # Account registration
    callback/            # OAuth callback handler
  class/[classId]/
    page.tsx             # Class hub & chat launcher
    thread/[threadId]/   # Chat thread view
    flashcards/          # Flashcard study mode
    quiz/                # Quiz mode
    drills/              # Practice drills
    videos/              # Video recommendations
    settings/            # Class settings
  dashboard/             # User dashboard
  planner/               # Study planner
  settings/              # User preferences
components/
  Sidebar.tsx            # Navigation with classes & threads
  ChatThread.tsx         # Message rendering with special block parsing
  ChatInput.tsx          # Chat input form
  InteractiveDrill.tsx   # Step-by-step drill component
  PracticeProblem.tsx    # Inline practice problem component
  VideoResources.tsx     # Video recommendation cards
  AddClassModal.tsx      # Class creation modal
  ConfirmModal.tsx       # Confirmation dialog
lib/
  store.tsx              # Global state (Context + useReducer)
  types.ts               # TypeScript interfaces
  supabase/
    client.ts            # Browser Supabase client
    server.ts            # Server Supabase client
middleware.ts            # Auth route protection
```

## Database Schema

The app uses Supabase with the following tables:

- **classes** - Courses with optional syllabus text (`id`, `user_id`, `name`, `syllabus_text`)
- **threads** - Chat conversations grouped by class
- **messages** - Individual messages in threads (`role`: user/assistant)
- **flashcards** - Cards with SM-2 fields (`ease_factor`, `interval`, `repetitions`, `next_review`)
- **quizzes** - Quiz attempts with questions (JSON), answers (JSON), and scores
- **study_events** - Exam and deadline tracking

All tables are scoped to `user_id` with row-level security.

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)
- A [Reducto API key](https://app.reducto.ai) (for PDF syllabus parsing)

### 1. Clone and install

```bash
git clone <repository-url>
cd study-tool
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

```env
# Anthropic - powers AI tutoring, quizzes, and flashcard generation
ANTHROPIC_API_KEY=your-api-key-here

# Reducto - parses PDF syllabi into text
REDUCTO_API_KEY=your-reducto-key-here

# Supabase - authentication and database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set up Supabase

Create the following tables in your Supabase project. Enable Row Level Security on all tables and add policies scoped to `auth.uid() = user_id`.

**classes**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, default `gen_random_uuid()` |
| user_id | uuid | References `auth.users(id)` |
| name | text | |
| syllabus_text | text | Nullable |
| created_at | timestamptz | Default `now()` |

**threads**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| class_id | uuid | References `classes(id)` |
| user_id | uuid | References `auth.users(id)` |
| title | text | |
| created_at | timestamptz | Default `now()` |
| updated_at | timestamptz | Default `now()` |

**messages**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| thread_id | uuid | References `threads(id)` |
| role | text | `user` or `assistant` |
| content | text | |
| created_at | timestamptz | Default `now()` |

**flashcards**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| class_id | uuid | References `classes(id)` |
| user_id | uuid | References `auth.users(id)` |
| front | text | |
| back | text | |
| ease_factor | float | Default `2.5` |
| interval | integer | Default `0` |
| repetitions | integer | Default `0` |
| next_review | timestamptz | Default `now()` |
| created_at | timestamptz | Default `now()` |

**quizzes**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| class_id | uuid | References `classes(id)` |
| user_id | uuid | References `auth.users(id)` |
| questions | jsonb | |
| answers | jsonb | Nullable |
| score | integer | Nullable |
| total | integer | Nullable |
| completed_at | timestamptz | Nullable |
| created_at | timestamptz | Default `now()` |

**study_events**

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | References `auth.users(id)` |
| class_id | uuid | References `classes(id)` |
| title | text | |
| event_type | text | |
| date | timestamptz | |
| completed | boolean | Default `false` |
| created_at | timestamptz | Default `now()` |

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app. Create an account, add a class, optionally upload a syllabus, and start studying.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## State Management

The app uses React Context with `useReducer` for global state. The store (`lib/store.tsx`) manages:

- User authentication state
- Classes, threads, and messages
- Flashcards with spaced repetition metadata
- Quizzes and scores
- User settings (persisted to localStorage per user)

Settings are stored in localStorage under the key `studyset-settings-{userId}` and include difficulty, response length, and practice problem preferences.

## Authentication

Authentication is handled by Supabase with email/password. The Next.js middleware (`middleware.ts`) protects all routes except `/auth/*`, redirecting unauthenticated users to the login page. All API routes verify the user session and return 401 if invalid.

## AI Integration

The app uses Claude (claude-haiku-4-5) through the Anthropic SDK. AI responses can include special delimited blocks that the frontend parses and renders as interactive components:

- `:::practice ... :::` - Inline practice problems with answer submission
- `:::drill ... :::` - Multi-step interactive drills with hints
- `:::videos ... :::` - Video recommendation cards with YouTube links

System prompts are dynamically constructed using the course name, syllabus content, difficulty level, response length, and practice problem settings.

## Deployment

The app is built for deployment on [Vercel](https://vercel.com) but works on any platform that supports Node.js. Ensure all environment variables are configured in your hosting provider's settings.

```bash
npm run build
npm start
```
