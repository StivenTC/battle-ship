import { GameStatus, type GameState } from "@battle-ship/shared";
import { Player } from "./Player.js";

export class Game {
  public readonly id: string;
  public players: Map<string, Player>;
  public status: GameStatus;
  public turn: string; // Player ID
  public turnCount: number;
  public winner?: string;

  constructor(id: string) {
    this.id = id;
    this.players = new Map();
    this.status = GameStatus.Waiting;
    this.turn = "";
    this.turnCount = 0;
  }

  addPlayer(id: string): Player {
    const existingPlayer = this.players.get(id);
    if (existingPlayer) {
      return existingPlayer;
    }

    if (this.players.size >= 2) {
      throw new Error("Game is full");
    }

    const player = new Player(id);
    this.players.set(id, player);
    return player;
  }

  startGame() {
    if (this.players.size < 2) {
      throw new Error("Not enough players");
    }

    if (this.status !== GameStatus.Waiting) {
      return;
    }

    this.status = GameStatus.Placement;

    // Randomize starting turn (optional, or fixed)
    const playerIds = Array.from(this.players.keys());
    this.turn = playerIds[0]; // Simple for now
  }

  // Switch to combat when both ready
  checkReady() {
    const allReady = Array.from(this.players.values()).every((p) => p.isReady);
    if (allReady && this.status === GameStatus.Placement) {
      this.status = GameStatus.Combat;
      this.turnCount = 1;
    }
  }

  switchTurn() {
    if (this.status !== GameStatus.Combat) return;

    const playerIds = Array.from(this.players.keys());
    const currentIndex = playerIds.indexOf(this.turn);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.turn = playerIds[nextIndex];

    const nextPlayer = this.players.get(this.turn);
    if (nextPlayer) {
      nextPlayer.regenerateAP();
      if (nextPlayer.id === playerIds[0]) {
        this.turnCount++;
      }
    }
  }

  toState(): GameState {
    const playersRecord: GameState["players"] = {};
    for (const [id, player] of this.players) {
      playersRecord[id] = {
        id: player.id,
        name: player.id, // Placeholder
        ships: player.ships,
        mines: [], // TODO
        ap: player.ap,
        isReady: player.isReady,
        isConnected: true,
      };
    }

    return {
      id: this.id,
      status: this.status,
      players: playersRecord,
      turn: this.turn,
      turnCount: this.turnCount,
      winner: this.winner,
    };
  }
}
