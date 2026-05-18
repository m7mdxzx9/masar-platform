import { create } from 'zustand'
import { api } from '@/services/api'

export interface FlashcardDeck {
  id: number
  title: string
  description: string | null
  card_count: number
  due_count: number
  created_at: string | null
}

export interface FlashcardCard {
  id: number
  front: string
  back: string
  easiness_factor: number
  interval: number
  repetitions: number
  next_review: string | null
  is_due: boolean
}

interface FlashcardState {
  decks: FlashcardDeck[]
  currentDeck: FlashcardDeck | null
  cards: FlashcardCard[]
  currentCardIndex: number
  isFlipped: boolean
  isLoading: boolean
  error: string | null
  fetchDecks: () => Promise<void>
  createDeck: (title: string, description?: string) => Promise<void>
  deleteDeck: (deckId: number) => Promise<void>
  selectDeck: (deck: FlashcardDeck) => Promise<void>
  addCard: (deckId: number, front: string, back: string) => Promise<void>
  reviewCard: (cardId: number, quality: number) => Promise<void>
  flipCard: () => void
  nextCard: () => void
  reset: () => void
}

export const useFlashcardStore = create<FlashcardState>((set, get) => ({
  decks: [],
  currentDeck: null,
  cards: [],
  currentCardIndex: 0,
  isFlipped: false,
  isLoading: false,
  error: null,

  fetchDecks: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get<{ decks: FlashcardDeck[] }>('/flashcards/decks')
      set({ decks: data.decks, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load decks', isLoading: false })
    }
  },

  createDeck: async (title, description) => {
    try {
      await api.post('/flashcards/decks', { title, description })
      await get().fetchDecks()
    } catch (err: any) {
      set({ error: err.message || 'Failed to create deck' })
    }
  },

  deleteDeck: async (deckId) => {
    try {
      await api.delete(`/flashcards/decks/${deckId}`)
      const { currentDeck } = get()
      if (currentDeck?.id === deckId) {
        set({ currentDeck: null, cards: [], currentCardIndex: 0, isFlipped: false })
      }
      await get().fetchDecks()
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete deck' })
    }
  },

  selectDeck: async (deck) => {
    set({ currentDeck: deck, currentCardIndex: 0, isFlipped: false })
    try {
      const { data } = await api.get<{ cards: FlashcardCard[] }>(`/flashcards/decks/${deck.id}/cards`)
      set({ cards: data.cards })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load cards' })
    }
  },

  addCard: async (deckId, front, back) => {
    try {
      await api.post(`/flashcards/decks/${deckId}/cards`, { front, back })
      const deck = get().currentDeck
      if (deck) await get().selectDeck(deck)
      await get().fetchDecks()
    } catch (err: any) {
      set({ error: err.message || 'Failed to add card' })
    }
  },

  reviewCard: async (cardId, quality) => {
    try {
      await api.post(`/flashcards/cards/${cardId}/review`, { quality })
      const { currentCardIndex, cards } = get()
      if (currentCardIndex < cards.length - 1) {
        set({ currentCardIndex: currentCardIndex + 1, isFlipped: false })
      } else {
        set({ isFlipped: false })
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to submit review' })
    }
  },

  flipCard: () => set((s) => ({ isFlipped: !s.isFlipped })),
  nextCard: () => {
    const { currentCardIndex, cards } = get()
    if (currentCardIndex < cards.length - 1) {
      set({ currentCardIndex: currentCardIndex + 1, isFlipped: false })
    }
  },
  reset: () => set({ currentDeck: null, cards: [], currentCardIndex: 0, isFlipped: false, error: null }),
}))
