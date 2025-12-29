import {
  type AttackDto,
  GameEvents,
  GameStatus,
  type JoinGameDto,
  type PlaceMineDto,
  type PlaceShipDto,
  type SkillName,
} from "@battle-ship/shared";
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
// biome-ignore lint/style/useImportType: dependency injection requires value import
import { GameManagerService } from "./game-manager.service.js";
import type { Game } from "./domain/Game.js";
import type { Player } from "./domain/Player.js";

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Map socketId -> [playerId, gameId]
  private clients: Map<string, { playerId: string; gameId?: string }> = new Map();

  constructor(private readonly gameManager: GameManagerService) {}

  handleConnection(client: Socket) {
    console.log("Client connected:", client.id);
    // client.emit(GameEvents.GAME_STATE, ...); // Can't emit state yet, no game joined
  }

  handleDisconnect(client: Socket) {
    console.log("Client disconnected:", client.id);
    this.clients.delete(client.id);
  }

  @SubscribeMessage(GameEvents.CREATE_GAME)
  handleCreateGame(@MessageBody() dto: { playerId: string }, @ConnectedSocket() client: Socket) {
    try {
      const playerId = dto.playerId;
      this.clients.set(client.id, { playerId });

      const game = this.gameManager.createGame(playerId);
      this.joinPlayerToGame(client, game, playerId);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage(GameEvents.JOIN_GAME)
  handleJoinGame(@MessageBody() dto: JoinGameDto, @ConnectedSocket() client: Socket) {
    console.log("Backend received JOIN_GAME DTO:", dto);
    try {
      this.clients.set(client.id, { playerId: dto.playerId });

      let game: Game | undefined;

      if (dto.gameId) {
        game = this.gameManager.getGame(dto.gameId);
        if (!game) {
          throw new Error("Game not found");
        }
      } else {
        // Random match fallback
        game = this.gameManager.findMatch(dto.playerId);
        if (!game) {
          game = this.gameManager.createGame(dto.playerId);
        }
      }

      this.joinPlayerToGame(client, game, dto.playerId);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage(GameEvents.PLACE_SHIP)
  handlePlaceShip(@MessageBody() dto: PlaceShipDto, @ConnectedSocket() client: Socket) {
    const ctx = this.getGameContext(client);
    if (!ctx) return;
    const { game, player } = ctx;

    // Validate Placement Phase
    if (game.status !== GameStatus.Placement && game.status !== GameStatus.Waiting) {
      return this.handleError(client, "Not in placement phase");
    }

    const success = player.placeShip(dto.type, dto.size, 1, dto.start, dto.horizontal);

    if (success) {
      game.checkReady(); // Check if ready to fight
      this.emitGameState(game);
    } else {
      this.handleError(client, "Invalid ship placement");
    }
  }

  @SubscribeMessage(GameEvents.PLACE_MINE)
  handlePlaceMine(@MessageBody() dto: PlaceMineDto, @ConnectedSocket() client: Socket) {
    const ctx = this.getGameContext(client);
    if (!ctx) return;
    const { game, player } = ctx;

    if (game.status !== GameStatus.Placement) {
      return this.handleError(client, "Not in placement phase");
    }

    const success = player.placeMine(dto.x, dto.y);
    if (success) {
      this.emitGameState(game);
    } else {
      this.handleError(client, "Invalid mine placement");
    }
  }

  @SubscribeMessage(GameEvents.PLAYER_READY)
  handlePlayerReady(@MessageBody() dto: { playerId: string }, @ConnectedSocket() client: Socket) {
    const ctx = this.getGameContext(client);
    if (!ctx) return;
    const { game, player } = ctx;

    console.log(`Player ${dto.playerId} setting ready...`);
    player.setReady();
    console.log(`Player ${dto.playerId} is now ready: ${player.isReady}`);
    game.checkReady();

    this.emitGameState(game);
  }

  @SubscribeMessage(GameEvents.ATTACK)
  async handleAttack(@MessageBody() dto: AttackDto, @ConnectedSocket() client: Socket) {
    const ctx = this.getGameContext(client);
    if (!ctx) return;
    const { game } = ctx;

    if (game.status !== GameStatus.Combat) {
      return this.handleError(client, "Not in combat phase");
    }

    if (game.turn !== dto.playerId) {
      return this.handleError(client, "Not your turn");
    }

    // Attack Logic
    const success = game.attack(dto.playerId, dto.x, dto.y);

    if (success) {
      if (game.winner) {
        await this.gameManager.handleGameOver(game, game.winner);
      }
      this.emitGameState(game);
    } else {
      this.handleError(client, "Attack failed (Invalid turn or not enough AP)");
    }
  }
  @SubscribeMessage(GameEvents.USE_SKILL)
  async handleUseSkill(
    @MessageBody() dto: {
      playerId: string;
      skillName: SkillName;
      target?: { x: number; y: number };
    },
    @ConnectedSocket() client: Socket
  ) {
    const ctx = this.getGameContext(client);
    if (!ctx) return;
    const { game } = ctx;

    // Validate Status
    if (game.status !== GameStatus.Combat) {
      return this.handleError(client, "Not in combat phase");
    }

    // Validate Turn
    if (game.turn !== dto.playerId) {
      return this.handleError(client, "Not your turn");
    }

    const target = dto.target || { x: 0, y: 0 }; // Should be provided
    const success = game.useSkill(dto.playerId, dto.skillName, target);

    if (success) {
      // Check Win Condition
      const opponentId = Array.from(game.players.keys()).find((id) => id !== dto.playerId);
      const opponent = opponentId ? game.players.get(opponentId) : null;

      if (opponent?.hasLost()) {
        await this.gameManager.handleGameOver(game, dto.playerId);
      } else {
        game.switchTurn();
      }

      this.emitGameState(game);
    } else {
      this.handleError(client, "Skill usage failed (Not enough AP?)");
    }
  }

  /* --- Private Helpers --- */

  private getGameContext(client: Socket): { game: Game; player: Player } | null {
    const clientData = this.clients.get(client.id);
    if (!clientData?.gameId) return null;

    const game = this.gameManager.getGame(clientData.gameId);
    if (!game) return null;

    const player = game.players.get(clientData.playerId); // We stored playerId in clients map too
    if (!player) return null;

    return { game, player };
  }

  private updateClientGameId(clientId: string, gameId: string) {
    const data = this.clients.get(clientId);
    if (data) data.gameId = gameId;
  }

  private joinPlayerToGame(client: Socket, game: Game, playerId: string) {
    game.addPlayer(playerId);
    client.join(game.id);
    this.updateClientGameId(client.id, game.id);

    // Auto-start check
    if (game.players.size === 2) {
      game.startGame();
    }

    this.emitGameState(game);
  }

  private handleError(client: Socket, error: unknown) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
    client.emit(GameEvents.ERROR, { message });
  }

  private emitGameState(game: Game) {
    // Iterate over all connected clients to find those in this game
    for (const [socketId, data] of this.clients.entries()) {
      if (data.gameId === game.id) {
        // Send state visible to THIS player
        const state = game.toState(data.playerId);
        this.server.to(socketId).emit(GameEvents.GAME_STATE, state);
      }
    }
  }
}
