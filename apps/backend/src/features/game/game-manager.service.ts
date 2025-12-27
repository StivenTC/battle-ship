import { GameStatus } from "@battle-ship/shared";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Game } from "./domain/Game.js";
// biome-ignore lint/style/useImportType: dependency injection requires value import
import { UsersService } from "../users/users.service.js";

@Injectable()
export class GameManagerService {
  private games: Map<string, Game> = new Map();

  constructor(private readonly usersService: UsersService) {
    // Determine how to persist active games if needed.
    // For now, in-memory games map.
  }

  createGame(hostId: string): Game {
    let gameId = this.generateRoomCode();
    while (this.games.has(gameId)) {
      gameId = this.generateRoomCode();
    }
    const game = new Game(gameId);
    this.games.set(gameId, game);
    return game;
  }

  private generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  // Find a waiting game to join randomly
  findMatch(playerId: string): Game | undefined {
    for (const game of this.games.values()) {
      if (
        game.status === GameStatus.Waiting &&
        game.players.size < 2 &&
        !game.players.has(playerId)
      ) {
        return game;
      }
    }
    return undefined;
  }

  async handleGameOver(game: Game, winnerId: string) {
    game.winner = winnerId;
    game.status = GameStatus.Finished;

    const loserId = Array.from(game.players.keys()).find((id) => id !== winnerId);

    if (winnerId) await this.usersService.addWin(winnerId);
    if (loserId) await this.usersService.addLoss(loserId);

    // Keep game in memory for a bit to show results, then maybe clean up?
  }
}
