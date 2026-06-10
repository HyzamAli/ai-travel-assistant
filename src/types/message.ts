export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'streaming' | 'done' | 'error';

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
};
