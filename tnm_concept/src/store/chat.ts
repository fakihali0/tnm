import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // Changed from Date to string (ISO 8601) for proper serialization
  type?: 'analysis' | 'insight' | 'alert' | 'general' | 'welcome';
}

interface ConversationState {
  messages: ChatMessage[];
  isLoading: boolean;
}

interface ChatStore {
  conversations: Record<string, ConversationState>;
  activeConversationId: string;
  
  // Actions
  setActiveConversation: (conversationId: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  setLoading: (conversationId: string, loading: boolean) => void;
  clearConversation: (conversationId: string) => void;
  clearAllConversations: () => void;
  
  // Getters
  getMessages: (conversationId: string) => ChatMessage[];
  getIsLoading: (conversationId: string) => boolean;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: {},
      activeConversationId: 'global',

      setActiveConversation: (conversationId: string) => {
        set({ activeConversationId: conversationId });
        
        // Initialize conversation if it doesn't exist
        const state = get();
        if (!state.conversations[conversationId]) {
          set({
            conversations: {
              ...state.conversations,
              [conversationId]: {
                messages: [],
                isLoading: false,
              },
            },
          });
        }
      },

      addMessage: (conversationId: string, message: ChatMessage) => {
        const state = get();
        const conversation = state.conversations[conversationId] || {
          messages: [],
          isLoading: false,
        };

        set({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              messages: [...conversation.messages, message],
            },
          },
        });
      },

      setLoading: (conversationId: string, loading: boolean) => {
        const state = get();
        const conversation = state.conversations[conversationId] || {
          messages: [],
          isLoading: false,
        };

        set({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              isLoading: loading,
            },
          },
        });
      },

      clearConversation: (conversationId: string) => {
        const state = get();
        set({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              messages: [],
              isLoading: false,
            },
          },
        });
      },

      clearAllConversations: () => {
        set({ conversations: {} });
      },

      getMessages: (conversationId: string) => {
        const state = get();
        return state.conversations[conversationId]?.messages || [];
      },

      getIsLoading: (conversationId: string) => {
        const state = get();
        return state.conversations[conversationId]?.isLoading || false;
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: Object.entries(state.conversations).reduce((acc, [id, conv]) => ({
          ...acc,
          [id]: {
            ...conv,
            messages: conv.messages.map(m => ({
              ...m,
              timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date(m.timestamp).toISOString()
            }))
          }
        }), {})
      }),
    }
  )
);