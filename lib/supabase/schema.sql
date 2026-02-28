-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Make sure to enable the auth schema first

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  syllabus_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  ease_factor DECIMAL(3, 2) NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  total INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE study_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('exam', 'deadline', 'study_session')),
  date TIMESTAMPTZ NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_classes" ON classes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_threads" ON threads FOR ALL USING (auth.uid() = user_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_messages" ON messages FOR ALL
  USING (thread_id IN (SELECT id FROM threads WHERE user_id = auth.uid()));

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_flashcards" ON flashcards FOR ALL USING (auth.uid() = user_id);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_quizzes" ON quizzes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE study_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_study_events" ON study_events FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_classes_user_id ON classes(user_id);
CREATE INDEX idx_threads_class_id ON threads(class_id);
CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_class_id ON flashcards(class_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review);
CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_quizzes_class_id ON quizzes(class_id);
CREATE INDEX idx_study_events_user_id ON study_events(user_id);
CREATE INDEX idx_study_events_class_id ON study_events(class_id);
