/** ThoughtManager removed — mascot system purged */
export type Thought = { id: string; content: string; phase?: string | null; confidence: number; };
export type TrinityNotificationCallback = (...args: any[]) => void;
export type TrinityPersonaContext = Record<string, any>;
export const thoughtManager = {
  subscribe: () => () => {},
  unsubscribe: () => {},
  setPersona: () => {},
  addThought: () => {},
  getThoughts: () => [],
  clearThoughts: () => {},
  onNotification: () => () => {},
};
