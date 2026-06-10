import { mockStreamReply } from '@/mocks/chatStream';
import { useChatStore } from '@/store/chatStore';

const FLUSH_MS = 16;
const EMPTY_REPLY_MESSAGE = 'Hmm, no reply came through. Try again?';
const ERROR_REPLY_MESSAGE = 'Something went wrong reaching the assistant.';

// Monotonic counter
let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export async function sendUserMessage(prompt: string): Promise<void> {
  const trimmed = prompt.trim();
  if (!trimmed) return;

  const store = useChatStore.getState();
  if (store.isStreaming) return;

  const userId = nextId('u');

  store.appendMessage({
    id: userId,
    role: 'user',
    content: trimmed,
    status: 'done',
  });
  store.setStreaming(true);

  let assistantId: string | null = null;
  let buffer = '';
  let flushed = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  // Batched flush — at most one React update per ~16ms regardless of how many
  // tokens arrive in that window.
  function flush() {
    timer = null;
    if (assistantId === null || buffer === flushed) return;
    flushed = buffer;
    useChatStore
      .getState()
      .updateMessage(assistantId, { content: flushed, status: 'streaming' });
  }

  function schedule() {
    if (timer != null) return;
    timer = setTimeout(flush, FLUSH_MS);
  }

  function clearTimer() {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  try {
    for await (const token of mockStreamReply(trimmed)) {
      buffer += token;
      if (assistantId === null) {
        // First token: append the assistant bubble seeded with this token
        assistantId = nextId('a');
        flushed = buffer;
        useChatStore.getState().appendMessage({
          id: assistantId,
          role: 'assistant',
          content: buffer,
          status: 'streaming',
        });
      } else {
        schedule();
      }
    }
    clearTimer();
    if (assistantId === null) {
      // Zero tokens yielded — append a friendly empty-reply bubble so the user
      // sees something land instead of LoadingBubble disappearing silently.
      useChatStore.getState().appendMessage({
        id: nextId('a'),
        role: 'assistant',
        content: EMPTY_REPLY_MESSAGE,
        status: 'error',
      });
    } else {
      useChatStore
        .getState()
        .updateMessage(assistantId, { content: buffer, status: 'done' });
    }
  } catch (err) {
    clearTimer();
    if (__DEV__) {
      // Surfaced for the developer; user sees the in-bubble error below.
      console.error('[chat] stream failed', err);
    }
    if (assistantId === null) {
      useChatStore.getState().appendMessage({
        id: nextId('a'),
        role: 'assistant',
        content: ERROR_REPLY_MESSAGE,
        status: 'error',
      });
    } else {
      useChatStore.getState().updateMessage(assistantId, {
        content: buffer || ERROR_REPLY_MESSAGE,
        status: 'error',
      });
    }
  } finally {
    useChatStore.getState().setStreaming(false);
  }
}
