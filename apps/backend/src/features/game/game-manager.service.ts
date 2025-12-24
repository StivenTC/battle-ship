import { GameStatus } from "@battle-ship/shared";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Game } from "./domain/Game.js";
import type { UsersService } from "../users/users.service.js";

@Injectable()
export class GameManagerService {
  private games: Map<string, Game> = new Map();

  constructor(private readonly usersService: UsersService) {
    // Determine how to persist active games if needed.
    // For now, in-memory games map.
  }

  createGame(hostId: string): Game {
    const gameId = crypto.randomUUID();
    const game = new Game(gameId);
    this.games.set(gameId, game);
    // game.addPlayer(hostId); // Host automatically joins? Usually yes.
    return game;
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
