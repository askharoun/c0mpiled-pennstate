"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { AppState, Class, ThreadWithMessages, Message, UserSettings, Flashcard, Quiz, StudyEvent, defaultSettings } from "./types";
import { createClient } from "./supabase/client";
import type { User } from "@supabase/supabase-js";

const initialState: AppState = {
  user: null,
  classes: [],
  threads: [],
  activeClassId: null,
  activeThreadId: null,
  loading: true,
  settings: defaultSettings,
  flashcards: [],
  quizzes: [],
  events: [],
};

type Action =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOAD_DATA"; payload: { classes: Class[]; threads: ThreadWithMessages[] } }
  | { type: "ADD_CLASS"; payload: Class }
  | { type: "UPDATE_CLASS"; payload: Class }
  | { type: "DELETE_CLASS"; payload: string }
  | { type: "SET_ACTIVE_CLASS"; payload: string | null }
  | { type: "SET_ACTIVE_THREAD"; payload: string | null }
  | { type: "ADD_THREAD"; payload: ThreadWithMessages }
  | { type: "ADD_MESSAGE"; payload: { threadId: string; message: Message } }
  | { type: "DELETE_THREAD"; payload: string }
  | { type: "UPDATE_SETTINGS"; payload: Partial<UserSettings> }
  | { type: "SET_FLASHCARDS"; payload: Flashcard[] }
  | { type: "ADD_FLASHCARDS"; payload: Flashcard[] }
  | { type: "UPDATE_FLASHCARD"; payload: Flashcard }
  | { type: "DELETE_FLASHCARD"; payload: string }
  | { type: "SET_QUIZZES"; payload: Quiz[] }
  | { type: "ADD_QUIZ"; payload: Quiz }
  | { type: "UPDATE_QUIZ"; payload: Quiz }
  | { type: "SET_EVENTS"; payload: StudyEvent[] }
  | { type: "ADD_EVENT"; payload: StudyEvent }
  | { type: "UPDATE_EVENT"; payload: StudyEvent }
  | { type: "DELETE_EVENT"; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "LOAD_DATA":
      return { ...state, classes: action.payload.classes, threads: action.payload.threads, loading: false };
    case "ADD_CLASS":
      return { ...state, classes: [...state.classes, action.payload] };
    case "UPDATE_CLASS":
      return {
        ...state,
        classes: state.classes.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };
    case "DELETE_CLASS":
      return {
        ...state,
        classes: state.classes.filter((c) => c.id !== action.payload),
        threads: state.threads.filter((t) => t.class_id !== action.payload),
        flashcards: state.flashcards.filter((f) => f.class_id !== action.payload),
        quizzes: state.quizzes.filter((q) => q.class_id !== action.payload),
        events: state.events.filter((e) => e.class_id !== action.payload),
        activeClassId: state.activeClassId === action.payload ? null : state.activeClassId,
      };
    case "SET_ACTIVE_CLASS":
      return { ...state, activeClassId: action.payload, activeThreadId: null };
    case "SET_ACTIVE_THREAD":
      return { ...state, activeThreadId: action.payload };
    case "ADD_THREAD":
      return { ...state, threads: [...state.threads, action.payload] };
    case "ADD_MESSAGE":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.payload.threadId
            ? {
                ...t,
                messages: [...t.messages, action.payload.message],
                updated_at: new Date().toISOString(),
              }
            : t
        ),
      };
    case "DELETE_THREAD":
      return {
        ...state,
        threads: state.threads.filter((t) => t.id !== action.payload),
        activeThreadId: state.activeThreadId === action.payload ? null : state.activeThreadId,
      };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "SET_FLASHCARDS":
      return { ...state, flashcards: action.payload };
    case "ADD_FLASHCARDS":
      console.log("Reducer: ADD_FLASHCARDS - adding", action.payload.length, "cards. Total before:", state.flashcards.length, "Total after:", state.flashcards.length + action.payload.length);
      console.log("Cards being added:", action.payload.map((c) => ({ id: c.id, class_id: c.class_id, front: c.front.substring(0, 30) })));
      return { ...state, flashcards: [...state.flashcards, ...action.payload] };
    case "UPDATE_FLASHCARD":
      return {
        ...state,
        flashcards: state.flashcards.map((f) => (f.id === action.payload.id ? action.payload : f)),
      };
    case "DELETE_FLASHCARD":
      return {
        ...state,
        flashcards: state.flashcards.filter((f) => f.id !== action.payload),
      };
    case "SET_QUIZZES":
      return { ...state, quizzes: action.payload };
    case "ADD_QUIZ":
      return { ...state, quizzes: [...state.quizzes, action.payload] };
    case "UPDATE_QUIZ":
      return {
        ...state,
        quizzes: state.quizzes.map((q) => (q.id === action.payload.id ? action.payload : q)),
      };
    case "SET_EVENTS":
      return { ...state, events: action.payload };
    case "ADD_EVENT":
      return { ...state, events: [...state.events, action.payload] };
    case "UPDATE_EVENT":
      return {
        ...state,
        events: state.events.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };
    case "DELETE_EVENT":
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.payload),
      };
    default:
      return state;
  }
}

interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addClass: (name: string, syllabusText: string) => Promise<Class>;
  updateClassSyllabus: (classId: string, syllabusText: string) => Promise<void>;
  updateClass: (classId: string, updates: Partial<Pick<Class, "name">>) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  createThread: (classId: string, title: string) => Promise<ThreadWithMessages>;
  addMessage: (threadId: string, role: "user" | "assistant", content: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => void;
  addFlashcards: (flashcards: Omit<Flashcard, "id" | "user_id" | "created_at">[]) => Promise<Flashcard[]>;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  addQuiz: (quiz: Omit<Quiz, "id" | "user_id" | "created_at">) => Promise<Quiz>;
  updateQuiz: (id: string, updates: Partial<Quiz>) => Promise<void>;
  addEvent: (event: Omit<StudyEvent, "id" | "user_id" | "created_at">) => Promise<StudyEvent>;
  updateEvent: (id: string, updates: Partial<StudyEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabase = createClient();

  // Load settings from localStorage
  useEffect(() => {
    if (state.user) {
      const stored = localStorage.getItem(`studyset-settings-${state.user.id}`);
      if (stored) {
        try {
          dispatch({ type: "UPDATE_SETTINGS", payload: JSON.parse(stored) });
        } catch { /* ignore */ }
      }
    }
  }, [state.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize: listen for auth state and load data
  useEffect(() => {
    let isMounted = true;

    async function loadUserData(userId: string) {
      try {
        // First, get the thread IDs
        const { data: threadData, error: threadError } = await supabase
          .from("threads")
          .select("id")
          .eq("user_id", userId);

        if (threadError) throw threadError;
        if (!isMounted) return;

        const threadIds = threadData?.map((t: { id: string }) => t.id) || [];

        // Load main data (classes, threads, messages)
        const [classesRes, threadsRes, messagesRes] = await Promise.all([
          supabase.from("classes").select("*").eq("user_id", userId).order("created_at"),
          supabase.from("threads").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
          threadIds.length > 0
            ? supabase.from("messages").select("*").in("thread_id", threadIds).order("created_at")
            : Promise.resolve({ data: [] }),
        ]);

        if (!isMounted) return;

        const classes = (classesRes.data || []) as Class[];
        const threads = (threadsRes.data || []).map((t: Record<string, unknown>) => ({
          ...t,
          messages: (messagesRes.data || []).filter((m: Record<string, unknown>) => m.thread_id === t.id),
        })) as ThreadWithMessages[];

        dispatch({ type: "LOAD_DATA", payload: { classes, threads } });

        // Load flashcards, quizzes, events in parallel (non-blocking)
        Promise.all([
          supabase.from("flashcards").select("*").eq("user_id", userId).order("created_at"),
          supabase.from("quizzes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
          supabase.from("study_events").select("*").eq("user_id", userId).order("date"),
        ]).then(([flashcardsRes, quizzesRes, eventsRes]) => {
          if (!isMounted) return;
          if (flashcardsRes.data) dispatch({ type: "SET_FLASHCARDS", payload: flashcardsRes.data as Flashcard[] });
          if (quizzesRes.data) dispatch({ type: "SET_QUIZZES", payload: quizzesRes.data as Quiz[] });
          if (eventsRes.data) dispatch({ type: "SET_EVENTS", payload: eventsRes.data as StudyEvent[] });
        }).catch((err) => {
          console.warn("Failed to load optional data:", err);
        });
      } catch (err) {
        console.error("Failed to load user data:", err);
        if (isMounted) dispatch({ type: "SET_LOADING", payload: false });
      }
    }

    // Fallback: clear loading state after 5 seconds if it's still true
    const loadingTimeout = setTimeout(() => {
      dispatch({ type: "SET_LOADING", payload: false });
    }, 5000);

    // Use onAuthStateChange as the single source of truth for auth state.
    // This avoids concurrent getUser() calls that fight over the browser lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: { user?: User | null } | null) => {
      if (!isMounted) return;

      const user = session?.user ?? null;
      dispatch({ type: "SET_USER", payload: user });

      if (user && (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        await loadUserData(user.id);
      }
      if (!user && event === "INITIAL_SESSION") {
        dispatch({ type: "SET_LOADING", payload: false });
      }
      if (event === "SIGNED_OUT") {
        dispatch({ type: "LOAD_DATA", payload: { classes: [], threads: [] } });
        dispatch({ type: "SET_FLASHCARDS", payload: [] });
        dispatch({ type: "SET_QUIZZES", payload: [] });
        dispatch({ type: "SET_EVENTS", payload: [] });
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addClass = useCallback(
    async (name: string, syllabusText: string): Promise<Class> => {
      const userId = state.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("classes")
        .insert({ user_id: userId, name, syllabus_text: syllabusText })
        .select()
        .single();

      if (error) throw error;
      const cls = data as Class;
      dispatch({ type: "ADD_CLASS", payload: cls });
      return cls;
    },
    [state.user?.id, supabase]
  );

  const updateClassSyllabus = useCallback(
    async (classId: string, syllabusText: string): Promise<void> => {
      const { data, error } = await supabase
        .from("classes")
        .update({ syllabus_text: syllabusText })
        .eq("id", classId)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: "UPDATE_CLASS", payload: data as Class });
    },
    [supabase]
  );

  const updateClass = useCallback(
    async (classId: string, updates: Partial<Pick<Class, "name">>): Promise<void> => {
      const { data, error } = await supabase
        .from("classes")
        .update(updates)
        .eq("id", classId)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: "UPDATE_CLASS", payload: data as Class });
    },
    [supabase]
  );

  const deleteClass = useCallback(
    async (classId: string): Promise<void> => {
      const threadIds = state.threads.filter((t) => t.class_id === classId).map((t) => t.id);
      if (threadIds.length > 0) {
        await supabase.from("messages").delete().in("thread_id", threadIds);
      }
      await supabase.from("threads").delete().eq("class_id", classId);
      await supabase.from("flashcards").delete().eq("class_id", classId);
      await supabase.from("quizzes").delete().eq("class_id", classId);
      await supabase.from("study_events").delete().eq("class_id", classId);
      await supabase.from("classes").delete().eq("id", classId);
      dispatch({ type: "DELETE_CLASS", payload: classId });
    },
    [state.threads, supabase]
  );

  const deleteThread = useCallback(
    async (threadId: string): Promise<void> => {
      await supabase.from("messages").delete().eq("thread_id", threadId);
      await supabase.from("threads").delete().eq("id", threadId);
      dispatch({ type: "DELETE_THREAD", payload: threadId });
    },
    [supabase]
  );

  const createThread = useCallback(
    async (classId: string, title: string): Promise<ThreadWithMessages> => {
      const userId = state.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("threads")
        .insert({ class_id: classId, user_id: userId, title })
        .select()
        .single();

      if (error) throw error;
      const thread: ThreadWithMessages = { ...(data as ThreadWithMessages), messages: [] };
      dispatch({ type: "ADD_THREAD", payload: thread });
      return thread;
    },
    [state.user?.id, supabase]
  );

  const addMessage = useCallback(
    async (threadId: string, role: "user" | "assistant", content: string): Promise<void> => {
      const { data, error } = await supabase
        .from("messages")
        .insert({ thread_id: threadId, role, content })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", threadId);

      dispatch({ type: "ADD_MESSAGE", payload: { threadId, message: data as Message } });
    },
    [supabase]
  );

  const updateSettings = useCallback(
    (settings: Partial<UserSettings>) => {
      dispatch({ type: "UPDATE_SETTINGS", payload: settings });
      if (state.user?.id) {
        const merged = { ...state.settings, ...settings };
        localStorage.setItem(`studyset-settings-${state.user.id}`, JSON.stringify(merged));
      }
    },
    [state.user?.id, state.settings]
  );

  const addFlashcards = useCallback(
    async (cards: Omit<Flashcard, "id" | "user_id" | "created_at">[]): Promise<Flashcard[]> => {
      const userId = state.user?.id;
      if (!userId) throw new Error("Not authenticated");

      console.log("addFlashcards: Inserting", cards.length, "cards for user", userId);

      const cardsToInsert = cards.map((c) => ({ ...c, user_id: userId }));
      console.log("Inserting cards:", JSON.stringify(cardsToInsert[0], null, 2));

      const { data, error } = await supabase
        .from("flashcards")
        .insert(cardsToInsert)
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        console.error("Error code:", error?.code);
        console.error("Error message:", error?.message);
        console.error("Full error:", JSON.stringify(error));
        throw new Error(`Supabase error: ${error?.message || error?.code || JSON.stringify(error)}`);
      }

      console.log("addFlashcards: Successfully inserted, data:", data);
      const flashcards = data as Flashcard[];
      dispatch({ type: "ADD_FLASHCARDS", payload: flashcards });
      console.log("addFlashcards: Dispatched ADD_FLASHCARDS action");
      return flashcards;
    },
    [state.user?.id, supabase]
  );

  const updateFlashcard = useCallback(
    async (id: string, updates: Partial<Flashcard>): Promise<void> => {
      const { data, error } = await supabase
        .from("flashcards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: "UPDATE_FLASHCARD", payload: data as Flashcard });
    },
    [supabase]
  );

  const deleteFlashcard = useCallback(
    async (id: string): Promise<void> => {
      await supabase.from("flashcards").delete().eq("id", id);
      dispatch({ type: "DELETE_FLASHCARD", payload: id });
    },
    [supabase]
  );

  const addQuiz = useCallback(
    async (quiz: Omit<Quiz, "id" | "user_id" | "created_at">): Promise<Quiz> => {
      const userId = state.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("quizzes")
        .insert({ ...quiz, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      const q = data as Quiz;
      dispatch({ type: "ADD_QUIZ", payload: q });
      return q;
    },
    [state.user?.id, supabase]
  );

  const updateQuiz = useCallback(
    async (id: string, updates: Partial<Quiz>): Promise<void> => {
      const { data, error } = await supabase
        .from("quizzes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: "UPDATE_QUIZ", payload: data as Quiz });
    },
    [supabase]
  );

  const addEvent = useCallback(
    async (event: Omit<StudyEvent, "id" | "user_id" | "created_at">): Promise<StudyEvent> => {
      const userId = state.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("study_events")
        .insert({ ...event, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      const e = data as StudyEvent;
      dispatch({ type: "ADD_EVENT", payload: e });
      return e;
    },
    [state.user?.id, supabase]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<StudyEvent>): Promise<void> => {
      const { data, error } = await supabase
        .from("study_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: "UPDATE_EVENT", payload: data as StudyEvent });
    },
    [supabase]
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<void> => {
      await supabase.from("study_events").delete().eq("id", id);
      dispatch({ type: "DELETE_EVENT", payload: id });
    },
    [supabase]
  );

  if (state.loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar" />
      </div>
    );
  }

  return (
    <StoreContext.Provider
      value={{
        state,
        dispatch,
        addClass,
        updateClassSyllabus,
        updateClass,
        deleteClass,
        deleteThread,
        createThread,
        addMessage,
        updateSettings,
        addFlashcards,
        updateFlashcard,
        deleteFlashcard,
        addQuiz,
        updateQuiz,
        addEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
