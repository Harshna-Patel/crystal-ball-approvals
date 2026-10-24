'use client';
import { create } from 'zustand';
import { Action, Answer } from '../shared/contracts';
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  answer?: Answer;
  fallback?: boolean;
  failed?: boolean;
};
type State = {
  sessionId: string;
  messages: ChatMessage[];
  busy: boolean;
  error: string;
  open: boolean;
  action: Action;
  language: 'English' | 'Hindi' | 'Gujarati';
  set: (value: Partial<State>) => void;
};
export const useChat = create<State>((set) => ({
  sessionId: '',
  messages: [],
  busy: false,
  error: '',
  open: true,
  action: 'talk',
  language: 'English',
  set,
}));
