import {
  type AttackDto,
  GameEvents,
  GameStatus,
  type JoinGameDto,
  type PlaceMineDto,
  type PlaceShipDto,
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
import { Game } from "./domain/Game.js";

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
      // Important: Map socket to player so we can track disconnects if needed,
      // but primarily we rely on the playerId sent in events.
      this.clients.set(client.id, { playerId });

      const game = this.gameManager.createGame(playerId);
      game.addPlayer(playerId);

      client.join(game.id);

      const clientData = this.clients.get(client.id);
      if (clientData) clientData.gameId = game.id;

      this.server.to(game.id).emit(GameEvents.GAME_STATE, game.toState());
    } catch (error) {
      client.emit(GameEvents.ERROR, { message: (error as Error).message });
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

      const clientData = this.clients.get(client.id);
      if (clientData) clientData.gameId = game.id;

      // Auto-start check
      if (game.players.size === 2) {
        game.startGame();
      }

      this.server.to(game.id).emit(GameEvents.GAME_STATE, game.toState());
    } catch (error) {
      client.emit(GameEvents.ERROR, { message: (error as Error).message });
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
      this.server.to(game.id).emit(GameEvents.GAME_STATE, game.toState());
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
      this.server.to(game.id).emit(GameEvents.GAME_STATE, game.toState());
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

    player.setReady();
    game.checkReady();

    this.server.to(game.id).emit(GameEvents.GAME_STATE, game.toState());
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

      this.server.to(game.id).emit(GameEvents.GAME_STATE, game.toState());
    }
  }
}
