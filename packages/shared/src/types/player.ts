export type PlayerId = string;
export type TeamId = string;
export type SeatId = string;

export type PlayerConnectionStatus = "connected" | "disconnected";

export interface Player {
  id: PlayerId;
  displayName: string;
  connectionStatus: PlayerConnectionStatus;
  teamId?: TeamId;
  seatId?: SeatId;
}
