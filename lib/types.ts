import type { User } from "@supabase/supabase-js";

export interface Class {
  id: string;
  user_id: string;
  name: string;
  syllabus_text: string;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Thread {
  id: string;
  class_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ThreadWithMessages extends Thread {
  messages: Message[];
}

export interface UserSettings {
  difficulty: "easy" | "medium" | "hard";
  practiceProblemsEnabled: boolean;
  responseLength: "concise" | "detailed";
}

export interface Flashcard {
  id: string;
  class_id: string;
  user_id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "free_response";
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  class_id: string;
  user_id: string;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  score?: number;
  total?: number;
  completed_at?: string;
  created_at: string;
}

export interface StudyEvent {
  id: string;
  user_id: string;
  class_id: string;
  title: string;
  event_type: "exam" | "deadline" | "study_session";
  date: string;
  completed: boolean;
  created_at: string;
}

export interface AppState {
  user: User | null;
  classes: Class[];
  threads: ThreadWithMessages[];
  activeClassId: string | null;
  activeThreadId: string | null;
  loading: boolean;
  settings: UserSettings;
  flashcards: Flashcard[];
  quizzes: Quiz[];
  events: StudyEvent[];
}

export const defaultSettings: UserSettings = {
  difficulty: "medium",
  practiceProblemsEnabled: true,
  responseLength: "detailed",
};
