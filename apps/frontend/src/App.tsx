import { LobbyScreen } from "./components/game/Lobby/LobbyScreen";
import { Grid } from "./components/game/Grid/Grid";
import { SocketProvider } from "./context/SocketContext";
import { useGame } from "./hooks/useGame";
import styles from "./App.module.scss";
import "./index.scss";

const GameContainer = () => {
  const { gameState, error, loading, actions } = useGame();

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
            {/* Temp Status display */}
            <span style={{ marginLeft: 10 }}>Estado: {gameState.status}</span>
          </div>
          <Grid />
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <SocketProvider>
      <GameContainer />
    </SocketProvider>
  );
}

export default App;
