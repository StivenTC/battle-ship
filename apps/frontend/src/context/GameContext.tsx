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
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import { useUser } from "./UserContext";

interface GameContextType {
  gameState: GameState | null;
  error: string | null;
  loading: boolean;
  actions: {
    createGame: () => void;
    joinGame: (gameId: string) => void;
    placeShip: (type: ShipType, start: Coordinates, horizontal: boolean) => void;
    placeMine: (x: number, y: number) => void;
    playerReady: () => void;
    attack: (x: number, y: number) => void;
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { socket, connectionError } = useSocket();
  const { userId } = useUser();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync connection errors
  useEffect(() => {
    if (connectionError) {
      setError(connectionError);
      setLoading(false);
    }
  }, [connectionError]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    const onGameState = (state: GameState) => {
      console.log("GameContext: State Update:", state.status, state);
      setGameState(state);
      setLoading(false);
      setError(null);
    };

    const onError = (err: { message: string }) => {
      console.error("GameContext: Error:", err);
      setError(err.message);
      setLoading(false);
    };

    socket.on(GameEvents.GAME_STATE, onGameState);
    socket.on(GameEvents.ERROR, onError);

    return () => {
      socket.off(GameEvents.GAME_STATE, onGameState);
      socket.off(GameEvents.ERROR, onError);
    };
  }, [socket]);

  // Actions
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
      size: SHIP_CONFIG[type].size,
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

  return (
    <GameContext.Provider
      value={{
        gameState,
        error,
        loading,
        actions: {
          createGame,
          joinGame,
          placeShip,
          placeMine,
          playerReady,
          attack,
        },
      }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return { ...context, playerId: useUser().userId };
};
