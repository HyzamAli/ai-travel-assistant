import { useChatStore } from '@/store/chatStore';

const CANNED_REPLIES = [
  "Got it — I'll help you plan that. (Real streaming arrives in Story 2.3.)",
  'Tell me your dates and budget and I can tighten the picks.',
  'Nice pick. Want me to compare a couple of options side by side?',
  'I can pull together a day-by-day if you share the destination.',
];

let replyCursor = 0;

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// Stub for Story 2.2. Story 2.3 will replace the canned reply with a streamed
// token generator without changing this function's signature or call sites.
export function sendUserMessage(prompt: string): void {
  const trimmed = prompt.trim();
  if (!trimmed) return;

  const { appendMessage, setStreaming } = useChatStore.getState();

  appendMessage({
    id: nextId('u'),
    role: 'user',
    content: trimmed,
    status: 'done',
  });

  setStreaming(true);
  setTimeout(() => {
    const store = useChatStore.getState();
    store.appendMessage({
      id: nextId('a'),
      role: 'assistant',
      content: CANNED_REPLIES[replyCursor++ % CANNED_REPLIES.length],
      status: 'done',
    });
    store.setStreaming(false);
  }, 350);
}
