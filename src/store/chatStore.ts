import { Message } from '@/types/message';
import { create } from 'zustand';

type ChatState = {
  messages: Message[];
  isStreaming: boolean;
  appendMessage: (message: Message) => void;
  updateMessage: (
    id: string,
    patch: Partial<Pick<Message, 'content' | 'status'>>,
  ) => void;
  setStreaming: (isStreaming: boolean) => void;
  reset: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  reset: () => set({ messages: [], isStreaming: false }),
}));
