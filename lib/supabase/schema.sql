-- =============================================================
-- Study Tool - Full Supabase SQL Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =============================================================

-- 1. TABLES
-- =============================================================

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

-- 2. INDEXES
-- =============================================================

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
CREATE INDEX idx_study_events_date ON study_events(date);

-- 3. ROW LEVEL SECURITY
-- =============================================================
-- Uses (SELECT auth.uid()) subquery pattern for performance
-- (prevents re-evaluation per row). Separate policies per
-- operation so INSERT uses WITH CHECK and others use USING.

-- classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_select" ON classes
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "classes_insert" ON classes
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "classes_update" ON classes
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "classes_delete" ON classes
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- threads
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "threads_select" ON threads
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "threads_insert" ON threads
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "threads_update" ON threads
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "threads_delete" ON threads
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- messages (owned via thread ownership)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    thread_id IN (SELECT id FROM threads WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    thread_id IN (SELECT id FROM threads WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    thread_id IN (SELECT id FROM threads WHERE user_id = (SELECT auth.uid()))
  );

CREATE POLICY "messages_delete" ON messages
  FOR DELETE USING (
    thread_id IN (SELECT id FROM threads WHERE user_id = (SELECT auth.uid()))
  );

-- flashcards
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flashcards_select" ON flashcards
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "flashcards_insert" ON flashcards
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "flashcards_update" ON flashcards
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "flashcards_delete" ON flashcards
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quizzes_select" ON quizzes
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "quizzes_insert" ON quizzes
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "quizzes_update" ON quizzes
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "quizzes_delete" ON quizzes
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- study_events
ALTER TABLE study_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_events_select" ON study_events
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "study_events_insert" ON study_events
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "study_events_update" ON study_events
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "study_events_delete" ON study_events
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
