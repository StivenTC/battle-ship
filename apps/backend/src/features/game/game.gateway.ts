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
      game.addPlayer(playerId);

      client.join(game.id);
      this.updateClientGameId(client.id, game.id);

      this.emitGameState(game);
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

      game.addPlayer(dto.playerId);
      client.join(game.id); // Socket.io rooms
      this.updateClientGameId(client.id, game.id);

      // Auto-start check
      if (game.players.size === 2) {
        game.startGame();
      }

      this.emitGameState(game);
    } catch (error) {
      this.handleError(client, error);
    }
  }

  @SubscribeMessage(GameEvents.PLACE_SHIP)
  handlePlaceShip(@MessageBody() dto: PlaceShipDto, @ConnectedSocket() client: Socket) {
    const clientData = this.clients.get(client.id);
    if (!clientData?.gameId) return;

    const game = this.gameManager.getGame(clientData.gameId);
    if (!game) return;

    const player = game.players.get(dto.playerId);
    if (!player) return;

    if (game.status !== GameStatus.Placement && game.status !== GameStatus.Waiting) {
      return client.emit(GameEvents.ERROR, { message: "Not in placement phase" });
    }

    const success = player.placeShip(dto.type, dto.size, 1, dto.start, dto.horizontal);

    if (success) {
      game.checkReady(); // Check if ready to fight
      this.emitGameState(game);
    } else {
      client.emit(GameEvents.ERROR, { message: "Invalid ship placement" });
    }
  }

  @SubscribeMessage(GameEvents.PLACE_MINE)
  handlePlaceMine(@MessageBody() dto: PlaceMineDto, @ConnectedSocket() client: Socket) {
    const clientData = this.clients.get(client.id);
    if (!clientData?.gameId) return;

    const game = this.gameManager.getGame(clientData.gameId);
    if (!game) return;

    const player = game.players.get(dto.playerId);
    if (!player) return;

    if (game.status !== GameStatus.Placement) {
      return client.emit(GameEvents.ERROR, { message: "Not in placement phase" });
    }

    const success = player.placeMine(dto.x, dto.y);
    if (success) {
      this.emitGameState(game);
    } else {
      client.emit(GameEvents.ERROR, { message: "Invalid mine placement" });
    }
  }

  @SubscribeMessage(GameEvents.PLAYER_READY)
  handlePlayerReady(@MessageBody() dto: { playerId: string }, @ConnectedSocket() client: Socket) {
    const clientData = this.clients.get(client.id);
    if (!clientData?.gameId) return;

    const game = this.gameManager.getGame(clientData.gameId);
    if (!game) return;

    const player = game.players.get(dto.playerId);
    if (!player) return;

    console.log(`Player ${dto.playerId} setting ready...`);
    player.setReady();
    console.log(`Player ${dto.playerId} is now ready: ${player.isReady}`);
    game.checkReady();

    this.emitGameState(game);
  }

  @SubscribeMessage(GameEvents.ATTACK)
  async handleAttack(@MessageBody() dto: AttackDto, @ConnectedSocket() client: Socket) {
    const clientData = this.clients.get(client.id);
    if (!clientData?.gameId) return;

    const game = this.gameManager.getGame(clientData.gameId);
    if (!game) return;

    if (game.status !== GameStatus.Combat) {
      return client.emit(GameEvents.ERROR, { message: "Not in combat phase" });
    }

    if (game.turn !== dto.playerId) {
      return client.emit(GameEvents.ERROR, { message: "Not your turn" });
    }

    // Attack Logic
    const opponentId = Array.from(game.players.keys()).find((id) => id !== dto.playerId);
    if (!opponentId) return;
    const opponent = game.players.get(opponentId);

    if (opponent) {
      const result = opponent.receiveAttack(dto.x, dto.y);

      // CHECK WIN CONDITION
      if (opponent.hasLost()) {
        await this.gameManager.handleGameOver(game, dto.playerId);
      } else {
        game.switchTurn();
      }

      this.emitGameState(game);
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
    const clientData = this.clients.get(client.id);
    if (!clientData?.gameId) return;

    const game = this.gameManager.getGame(clientData.gameId);
    if (!game) return;

    // Validate Status
    if (game.status !== GameStatus.Combat) {
      return client.emit(GameEvents.ERROR, { message: "Not in combat phase" });
    }

    // Validate Turn
    if (game.turn !== dto.playerId) {
      return client.emit(GameEvents.ERROR, { message: "Not your turn" });
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
      client.emit(GameEvents.ERROR, { message: "Skill usage failed (Not enough AP?)" });
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

  private handleError(client: Socket, error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
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
