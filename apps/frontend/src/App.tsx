import { useState } from "react";
import { LobbyScreen } from "./components/game/Lobby/LobbyScreen";
import { Grid } from "./components/game/Grid/Grid";
import { SocketProvider } from "./context/SocketContext";
import { UserProvider, useUser } from "./context/UserContext";
import { SplashScreen } from "./components/startup/SplashScreen/SplashScreen";
import { IdentityModal } from "./components/startup/IdentityModal/IdentityModal";
import { useGame } from "./hooks/useGame";
import styles from "./App.module.scss";
import "./index.scss";

import { CombatView } from "./components/game/PhaseCombat/CombatView";
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
        return <CombatView />;
      case "Waiting":
        // Even if waiting, if we have a game ID, we generally show lobby or waiting room.
        // But here, if we just created/joined, status might be Waiting until 2nd player joins.
        return (
          <div className={styles.waitingRoom}>
            <h2>Sala de Espera: {gameState.id}</h2>
            <p>Esperando al oponente... 📡</p>
            <div className="spinner" />
          </div>
        );
      case "Finished":
        return <div>JUEGO TERMINADO - Ganador: {gameState.winner}</div>;
      default:
        return <div>Estado desconocido: {gameState.status}</div>;
    }
  };

  return (
    <div className={styles.appWrapper}>
      <h1 className={styles.appHeader}>Battleship</h1>
      {/* 
        Game Info Header could be inside specific views or global. 
        For now, let's keep it global if game exists 
      */}
      {gameState && (
        <div className={styles.gameInfo}>
          Partida ID: <strong>{gameState.id}</strong>
          <span style={{ marginLeft: 10 }}>
            {" | "} Capitan: <strong>{playerName}</strong>
          </span>
          <span style={{ marginLeft: 10 }}> | Estado: {gameState.status}</span>
        </div>
      )}

      {renderPhase()}
    </div>
  );
};

function App() {
  const [splashFinished, setSplashFinished] = useState(false);

  return (
    <UserProvider>
      <SocketProvider>
        {!splashFinished ? (
          <SplashScreen onFinish={() => setSplashFinished(true)} />
        ) : (
          <>
            <IdentityModal />
            <GameContainer />
          </>
        )}
      </SocketProvider>
    </UserProvider>
  );
}

export default App;
