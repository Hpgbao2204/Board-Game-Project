import type { PlayerId } from "@board-game-hub/shared";

export type RoyalCardId = "page" | "scout" | "duelist" | "shield" | "regent";

export interface RoyalCard {
  id: RoyalCardId;
  name: string;
  rank: number;
  count: number;
  text: string;
}

export interface RoyalPlayerState {
  hand: RoyalCardId[];
  discard: RoyalCardId[];
  eliminated: boolean;
  protected: boolean;
}

export interface RoyalMessengerState {
  deck: RoyalCardId[];
  players: Record<PlayerId, RoyalPlayerState>;
  playerOrder: PlayerId[];
  currentPlayerId: PlayerId;
  winnerPlayerId: PlayerId | null;
  log: string[];
}

export interface RoyalMessengerMove {
  cardIndex: number;
  targetPlayerId?: PlayerId;
  guessedCardId?: RoyalCardId;
}

export interface RoyalMessengerPublicState {
  deckCount: number;
  players: Record<
    PlayerId,
    {
      hand: Array<RoyalCardId | "hidden">;
      handCount: number;
      discard: RoyalCardId[];
      eliminated: boolean;
      protected: boolean;
    }
  >;
  playerOrder: PlayerId[];
  currentPlayerId: PlayerId | null;
  winnerPlayerId: PlayerId | null;
  log: string[];
}
