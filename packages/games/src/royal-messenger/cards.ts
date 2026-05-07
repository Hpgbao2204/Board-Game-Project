import type { RoyalCard, RoyalCardId } from "./types";

export const ROYAL_CARDS: Record<RoyalCardId, RoyalCard> = {
  page: {
    id: "page",
    name: "Page",
    rank: 1,
    count: 5,
    text: "Guess another player's hand. If correct, they are eliminated."
  },
  scout: {
    id: "scout",
    name: "Scout",
    rank: 2,
    count: 2,
    text: "Peek at another player's hand."
  },
  duelist: {
    id: "duelist",
    name: "Duelist",
    rank: 3,
    count: 2,
    text: "Compare hands with a target. Lower rank is eliminated."
  },
  shield: {
    id: "shield",
    name: "Shield",
    rank: 4,
    count: 2,
    text: "You cannot be targeted until your next turn."
  },
  regent: {
    id: "regent",
    name: "Regent",
    rank: 5,
    count: 1,
    text: "Highest card. Keep it safe until the deck runs out."
  }
};

export const ROYAL_CARD_IDS = Object.keys(ROYAL_CARDS) as RoyalCardId[];

export function createRoyalDeck(): RoyalCardId[] {
  return ROYAL_CARD_IDS.flatMap((cardId) =>
    Array.from({ length: ROYAL_CARDS[cardId].count }, () => cardId)
  );
}
