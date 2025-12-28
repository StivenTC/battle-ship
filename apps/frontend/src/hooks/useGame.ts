import {
  GameEvents,
  type GameState,
  type Coordinates,
  type ShipType,
  type PlaceShipDto,
  type PlaceMineDto,
  type AttackDto,
  SHIP_CONFIG,
} from "@battle-ship/shared";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { useUser } from "../context/UserContext";

export const useGame = () => {
  const { socket, connectionError } = useSocket();
  const { userId } = useUser();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
      setLoading(false);
    }
  }, [connectionError]);

  useEffect(() => {
    if (!socket) return;

    socket.on(GameEvents.GAME_STATE, (state: GameState) => {
      console.log("Game State Update:", state);
      setGameState(state);
      setLoading(false);
      setError(null);
    });

    socket.on(GameEvents.ERROR, (err: { message: string }) => {
      console.error("Game Error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => {
      socket.off(GameEvents.GAME_STATE);
      socket.off(GameEvents.ERROR);
    };
  }, [socket]);

  const createGame = () => {
    if (!socket || !userId) return;
    setLoading(true);
    socket.emit(GameEvents.CREATE_GAME, { playerId: userId });
  };

  const joinGame = (gameId: string) => {
    if (!socket || !userId) return;
    console.log("Frontend emitting JOIN_GAME with ID:", gameId, "Player:", userId);
    setLoading(true);
    socket.emit(GameEvents.JOIN_GAME, { gameId, playerId: userId });
  };

  const placeShip = (type: ShipType, start: Coordinates, horizontal: boolean) => {
    if (!socket || !gameState || !userId) return;
    const dto: PlaceShipDto = {
      playerId: userId,
      type,
      start,
      horizontal,
      size: SHIP_CONFIG[type].size, // Fix: Send real size
    };
    socket.emit(GameEvents.PLACE_SHIP, dto);
  };

  const attack = (x: number, y: number) => {
    if (!socket || !gameState || !userId) return;
    const dto: AttackDto = {
      playerId: userId,
      x,
      y,
    };
    socket.emit(GameEvents.ATTACK, dto);
  };

  const placeMine = (x: number, y: number) => {
    if (!socket || !gameState || !userId) return;
    const dto: PlaceMineDto = {
      playerId: userId,
      x,
      y,
    };
    socket.emit(GameEvents.PLACE_MINE, dto);
  };

  const playerReady = () => {
    if (!socket || !userId) return;
    socket.emit(GameEvents.PLAYER_READY, { playerId: userId });
  };

  return {
    gameState,
    error,
    loading,
    playerId: userId,
    actions: {
      createGame,
      joinGame,
      placeShip,
      placeMine,
      playerReady,
      attack,
    },
  };
};
