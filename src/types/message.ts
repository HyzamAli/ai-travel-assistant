export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'sending' | 'streaming' | 'done' | 'error';

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
};
