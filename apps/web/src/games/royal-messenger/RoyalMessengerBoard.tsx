import { useMemo, useState } from "react";
import { Crown, Eye, Shield, Swords, UserRound } from "lucide-react";
import type { PlayerId, RoomSnapshot } from "@board-game-hub/shared";

export type RoyalCardId = "page" | "scout" | "duelist" | "shield" | "regent";

interface RoyalMessengerPlayerPublicState {
  hand: Array<RoyalCardId | "hidden">;
  handCount: number;
  discard: RoyalCardId[];
  eliminated: boolean;
  protected: boolean;
}

export interface RoyalMessengerPublicState {
  deckCount: number;
  players: Record<PlayerId, RoyalMessengerPlayerPublicState>;
  playerOrder: PlayerId[];
  currentPlayerId: PlayerId | null;
  winnerPlayerId: PlayerId | null;
  log: string[];
}

interface RoyalMessengerBoardProps {
  currentPlayerId: PlayerId | null;
  onMove: (move: { cardIndex: number; targetPlayerId?: PlayerId; guessedCardId?: RoyalCardId }) => void;
  room: RoomSnapshot;
  state: RoyalMessengerPublicState;
  viewerId: PlayerId;
}

const cardInfo: Record<
  RoyalCardId,
  { icon: typeof UserRound; name: string; rank: number; text: string; tone: string }
> = {
  page: {
    icon: UserRound,
    name: "Page",
    rank: 1,
    text: "Guess a non-Page card. Correct guess eliminates the target.",
    tone: "from-amber-300 to-orange-600"
  },
  scout: {
    icon: Eye,
    name: "Scout",
    rank: 2,
    text: "Peek at a target player's hand.",
    tone: "from-sky-300 to-blue-700"
  },
  duelist: {
    icon: Swords,
    name: "Duelist",
    rank: 3,
    text: "Compare hands. Lower rank is eliminated.",
    tone: "from-rose-300 to-red-700"
  },
  shield: {
    icon: Shield,
    name: "Shield",
    rank: 4,
    text: "Protect yourself until your next turn.",
    tone: "from-emerald-300 to-green-700"
  },
  regent: {
    icon: Crown,
    name: "Regent",
    rank: 5,
    text: "Highest card. Keep it until the deck runs out.",
    tone: "from-purple-300 to-indigo-800"
  }
};

const guessableCards: RoyalCardId[] = ["scout", "duelist", "shield", "regent"];

export function RoyalMessengerBoard({
  currentPlayerId,
  onMove,
  room,
  state,
  viewerId
}: RoyalMessengerBoardProps) {
  const firstTarget = useMemo(
    () =>
      room.players.find(
        (player) =>
          player.id !== viewerId &&
          state.players[player.id] &&
          !state.players[player.id].eliminated &&
          !state.players[player.id].protected
      )?.id ?? "",
    [room.players, state.players, viewerId]
  );
  const [targetPlayerId, setTargetPlayerId] = useState(firstTarget);
  const [guessedCardId, setGuessedCardId] = useState<RoyalCardId>("scout");
  const viewerState = state.players[viewerId];
  const winner = state.winnerPlayerId
    ? room.players.find((player) => player.id === state.winnerPlayerId)
    : null;
  const isViewerTurn = currentPlayerId === viewerId;
  const activeTargets = room.players.filter(
    (player) =>
      player.id !== viewerId &&
      state.players[player.id] &&
      !state.players[player.id].eliminated &&
      !state.players[player.id].protected
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-blue-600 dark:text-cyan-300">
            Royal Messenger
          </p>
          <h2 className="text-2xl font-black">Court Cards</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Deck: {state.deckCount} cards · Turn: {getPlayerName(room, currentPlayerId)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black dark:bg-white/10">
          {winner ? `${winner.displayName} wins` : isViewerTurn ? "Your turn" : "Waiting"}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="grid gap-4">
          <div className="grid gap-3 rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Your Hand</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {viewerState.hand.map((cardId, index) =>
                cardId === "hidden" ? null : (
                  <RoyalCardView
                    cardId={cardId}
                    disabled={!isViewerTurn || Boolean(winner)}
                    key={`${cardId}-${index}`}
                    onClick={() =>
                      onMove({
                        cardIndex: index,
                        targetPlayerId: needsTarget(cardId) ? targetPlayerId : undefined,
                        guessedCardId: cardId === "page" ? guessedCardId : undefined
                      })
                    }
                  />
                )
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Move Options</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                Target
                <select
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-white/10 dark:bg-slate-950"
                  onChange={(event) => setTargetPlayerId(event.target.value)}
                  value={targetPlayerId}
                >
                  {activeTargets.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                Page Guess
                <select
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-white/10 dark:bg-slate-950"
                  onChange={(event) => setGuessedCardId(event.target.value as RoyalCardId)}
                  value={guessedCardId}
                >
                  {guessableCards.map((cardId) => (
                    <option key={cardId} value={cardId}>
                      {cardInfo[cardId].name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Players</p>
            <div className="mt-3 grid gap-2">
              {room.players.map((player) => {
                const playerState = state.players[player.id];
                return (
                  <div className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-900" key={player.id}>
                    <p className="font-black">{player.displayName}</p>
                    <p className="text-xs font-bold text-slate-500">
                      {playerState?.eliminated
                        ? "Eliminated"
                        : playerState?.protected
                          ? "Protected"
                          : `${playerState?.handCount ?? 0} card hand`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Discard: {playerState?.discard.map((cardId) => cardInfo[cardId].name).join(", ") || "none"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
            <p className="text-sm font-black uppercase tracking-wide text-slate-500">Court Log</p>
            <ul className="mt-3 grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {state.log.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

function RoyalCardView({
  cardId,
  disabled,
  onClick
}: {
  cardId: RoyalCardId;
  disabled: boolean;
  onClick: () => void;
}) {
  const card = cardInfo[cardId];
  const Icon = card.icon;

  return (
    <button
      className="group min-h-[260px] overflow-hidden rounded-2xl border border-white/20 bg-slate-950 p-0 text-left text-white shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <div className={`h-full bg-gradient-to-br ${card.tone} p-4`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide opacity-80">Rank {card.rank}</p>
            <h3 className="text-2xl font-black">{card.name}</h3>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/20">
            <Icon size={26} />
          </div>
        </div>
        <svg className="my-7 h-20 w-full opacity-90" viewBox="0 0 220 90" role="img">
          <path
            d="M20 70 C45 10, 75 10, 100 70 S155 130, 200 28"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="10"
          />
          <circle cx="110" cy="45" fill="currentColor" r="13" />
        </svg>
        <p className="rounded-xl bg-black/20 p-3 text-sm font-bold leading-relaxed">{card.text}</p>
      </div>
    </button>
  );
}

function needsTarget(cardId: RoyalCardId) {
  return cardId === "page" || cardId === "scout" || cardId === "duelist";
}

function getPlayerName(room: RoomSnapshot, playerId: PlayerId | null) {
  return room.players.find((player) => player.id === playerId)?.displayName ?? "Game over";
}
