import { mockStreamReply } from '@/mocks/chatStream';
import { useChatStore } from '@/store/chatStore';

const FLUSH_MS = 16;
const EMPTY_REPLY_MESSAGE = 'Hmm, no reply came through. Try again?';
const ERROR_REPLY_MESSAGE = 'Something went wrong reaching the assistant.';

// Monotonic counter so two IDs minted in the same Date.now() tick can't
// collide. Replaces a 4-char Math.random suffix which had a ~1-in-1.6M
// collision window per pair.
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
  const assistantId = nextId('a');

  store.appendMessage({
    id: userId,
    role: 'user',
    content: trimmed,
    status: 'done',
  });
  store.appendMessage({
    id: assistantId,
    role: 'assistant',
    content: '',
    status: 'sending',
  });
  store.setStreaming(true);

  let buffer = '';
  let flushed = '';
  let firstToken = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  // Batched flush — at most one React update per ~16ms regardless of how many
  // tokens arrive in that window. Without this, each token = one Zustand set =
  // one bubble re-measure in FlashList.
  function flush() {
    timer = null;
    if (buffer === flushed) return;
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
      if (firstToken) {
        // Flush the first token immediately so dots → text feels crisp; further
        // tokens fall through the 16ms batcher.
        firstToken = false;
        clearTimer();
        flush();
      } else {
        schedule();
      }
    }
    clearTimer();
    if (firstToken) {
      // Zero tokens yielded — render a friendly empty-reply state instead of a
      // permanently blank assistant bubble.
      useChatStore.getState().updateMessage(assistantId, {
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
      // eslint-disable-next-line no-console
      console.error('[chat] stream failed', err);
    }
    useChatStore.getState().updateMessage(assistantId, {
      content: buffer || ERROR_REPLY_MESSAGE,
      status: 'error',
    });
  } finally {
    useChatStore.getState().setStreaming(false);
  }
}
