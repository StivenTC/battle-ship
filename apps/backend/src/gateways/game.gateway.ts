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
import { Game } from "../domain/Game.js";

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private game: Game;
  // Map socketId -> playerId
  private clients: Map<string, string> = new Map();

  constructor() {
    // For now, single game instance
    this.game = new Game("default-game");
  }

  handleConnection(client: Socket) {
    console.log("Client connected:", client.id);
    client.emit(GameEvents.GAME_STATE, this.game.toState());
  }

  handleDisconnect(client: Socket) {
    console.log("Client disconnected:", client.id);
    const playerId = this.clients.get(client.id);
    if (playerId) {
      // Handle player disconnect logic if needed (reconnection capability)
      this.clients.delete(client.id);
    }
  }

  @SubscribeMessage(GameEvents.JOIN_GAME)
  handleJoinGame(@MessageBody() dto: JoinGameDto, @ConnectedSocket() client: Socket) {
    try {
      this.game.addPlayer(dto.playerId);
      this.clients.set(client.id, dto.playerId);

      // Auto-start if ready (simplified for now)
      if (this.game.players.size === 2) {
        // this.game.startGame();
        // logic to be refined with explicit ready check
      }

      this.server.emit(GameEvents.GAME_STATE, this.game.toState());
    } catch (error) {
      client.emit(GameEvents.ERROR, { message: (error as Error).message });
    }
  }

  @SubscribeMessage(GameEvents.PLACE_SHIP)
  handlePlaceShip(@MessageBody() dto: PlaceShipDto, @ConnectedSocket() client: Socket) {
    const player = this.game.players.get(dto.playerId);
    if (!player) return;

    if (this.game.status !== GameStatus.Placement && this.game.status !== GameStatus.Waiting) {
      // Allow placement during waiting/placement
      return client.emit(GameEvents.ERROR, { message: "Not in placement phase" });
    }

    // Ensure status is Placement if not already
    if (this.game.status === GameStatus.Waiting && this.game.players.size === 2) {
      this.game.startGame();
    }

    const success = player.placeShip(
      dto.type,
      dto.size,
      1, // cost placeholder
      dto.start,
      dto.horizontal
    );

    if (success) {
      // Check ready state?
      // player.isReady = true; // when all ships placed?
      this.server.emit(GameEvents.GAME_STATE, this.game.toState());
    } else {
      client.emit(GameEvents.ERROR, { message: "Invalid ship placement" });
    }
  }

  @SubscribeMessage(GameEvents.PLACE_MINE)
  handlePlaceMine(@MessageBody() dto: PlaceMineDto, @ConnectedSocket() client: Socket) {
    const player = this.game.players.get(dto.playerId);
    if (!player) return;

    if (this.game.status !== GameStatus.Placement) {
      // Mines are placed during placement phase? Or anytime?
      // Rules say: "2 hidden mines per player". Usually setup phase.
      return client.emit(GameEvents.ERROR, { message: "Not in placement phase" });
    }

    const success = player.placeMine(dto.x, dto.y);
    if (success) {
      this.server.emit(GameEvents.GAME_STATE, this.game.toState());
    } else {
      client.emit(GameEvents.ERROR, { message: "Invalid mine placement" });
    }
  }

  @SubscribeMessage(GameEvents.ATTACK)
  handleAttack(@MessageBody() dto: AttackDto, @ConnectedSocket() client: Socket) {
    if (this.game.status !== GameStatus.Combat) {
      return client.emit(GameEvents.ERROR, { message: "Not in combat phase" });
    }

    if (this.game.turn !== dto.playerId) {
      return client.emit(GameEvents.ERROR, { message: "Not your turn" });
    }

    // Logic to find opponent
    // const opponent = ...
    // const result = opponent.receiveAttack(dto.x, dto.y);
    // this.game.switchTurn();
    // this.server.emit(GameEvents.GAME_STATE, this.game.toState());
  }
}
