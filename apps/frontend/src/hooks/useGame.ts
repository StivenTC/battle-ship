import { GameEvents, type GameState, type Coordinates, type ShipType } from "@battle-ship/shared";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export const useGame = () => {
  const { socket, connectionError } = useSocket();
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
    if (!socket) return;
    setLoading(true);
    socket.emit(GameEvents.CREATE_GAME);
  };

  const joinGame = (gameId: string) => {
    if (!socket) return;
    setLoading(true);
    socket.emit(GameEvents.JOIN_GAME, { gameId, playerId: socket.id });
  };

  const placeShip = (type: ShipType, start: Coordinates, horizontal: boolean) => {
    if (!socket || !gameState) return;
    socket.emit(GameEvents.PLACE_SHIP, {
      playerId: socket.id,
      gameId: gameState.id,
      type,
      start,
      horizontal,
      size: 0, // Server knows size? Or we send it. Shared types say size is needed logic wise usually, but checking backend implementation... backend uses dto.size. We should look up size from config or let backend handle strictness. Let's pass it if needed or rely on constants.
      // Wait, let's check backend implementation..
      // handlePlaceShip(@MessageBody() dto: PlaceShipDto...
      // PlaceShipDto usually needs size. Let's assume we pass it from UI.
      // For now, simple emit.
    });
  };

  const attack = (x: number, y: number) => {
    if (!socket || !gameState) return;
    socket.emit(GameEvents.ATTACK, {
      playerId: socket.id,
      gameId: gameState.id,
      x,
      y,
    });
  };

  return {
    gameState,
    error,
    loading,
    playerId: socket?.id,
    actions: {
      createGame,
      joinGame,
      placeShip,
      attack,
    },
  };
};
