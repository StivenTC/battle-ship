import { useState } from "react";
import { LobbyScreen } from "./components/game/Lobby/LobbyScreen";
import { WaitingRoom } from "./components/game/Lobby/WaitingRoom";
import { SocketProvider } from "./context/SocketContext";
import { UserProvider, useUser } from "./context/UserContext";
import { SplashScreen } from "./components/startup/SplashScreen/SplashScreen";
import { IdentityModal } from "./components/startup/IdentityModal/IdentityModal";
import { useGame } from "./hooks/useGame";
import styles from "./App.module.scss";
import "./index.scss";

import { CombatView } from "./components/game/PhaseCombat/CombatView";
import { GameHeader } from "./components/layout/GameHeader";
import { PlacementBoard } from "./components/game/PhaseTactical/PlacementBoard";
// LobbyScreen imported above
// Grid is no longer imported directly here

// ... imports

const GameContainer = () => {
  const { gameState, error, loading, actions } = useGame();
  const { playerName } = useUser();

  if (!playerName) return null; // Wait for identity

  // Helper to render current phase
  const renderPhase = () => {
    if (!gameState) {
      return (
        <LobbyScreen
          onCreate={actions.createGame}
          onJoin={actions.joinGame}
          error={error}
          loading={loading}
        />
      );
    }

    switch (gameState.status) {
      case "Placement":
        return <PlacementBoard onReady={actions.playerReady} />;
      case "Combat":
      case "Finished": // Let CombatView handle the result overlay
        return <CombatView />;
      case "Waiting":
        return <WaitingRoom gameId={gameState.id} />;
      default:
        return <div>Estado desconocido: {gameState.status}</div>;
    }
  };

  return (
    <div className={styles.appWrapper}>
      <GameHeader />
      <main>{renderPhase()}</main>
    </div>
  );
};

import { GameProvider } from "./context/GameContext";

function App() {
  const [splashFinished, setSplashFinished] = useState(false);

  return (
    <UserProvider>
      <SocketProvider>
        {!splashFinished ? (
          <SplashScreen onFinish={() => setSplashFinished(true)} />
        ) : (
          <GameProvider>
            <IdentityModal />
            <GameContainer />
          </GameProvider>
        )}
      </SocketProvider>
    </UserProvider>
  );
}

export default App;
