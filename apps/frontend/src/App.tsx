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

const GameContainer = () => {
  const { gameState, error, loading, actions } = useGame();
  const { playerName } = useUser();

  if (!playerName) return null; // Wait for identity

  return (
    <div className={styles.appWrapper}>
      <h1 className={styles.appHeader}>Battleship</h1>

      {!gameState ? (
        <LobbyScreen
          onCreate={actions.createGame}
          onJoin={actions.joinGame}
          error={error}
          loading={loading}
        />
      ) : (
        <>
          <div className={styles.gameInfo}>
            Partida ID: <strong>{gameState.id}</strong>
            <span style={{ marginLeft: 10 }}>
              {" "}
              | Capitan: <strong>{playerName}</strong>
            </span>
            <span style={{ marginLeft: 10 }}> | Estado: {gameState.status}</span>
          </div>
          <Grid />
        </>
      )}
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
