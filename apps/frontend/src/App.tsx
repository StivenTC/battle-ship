import { Grid } from "./components/game/Grid/Grid";
import { SocketProvider } from "./context/SocketContext";
import styles from "./App.module.scss";
import "./index.scss";

function App() {
  return (
    <SocketProvider>
      <div className={styles.appWrapper}>
        <h1 className={styles.appHeader}>Battleship</h1>
        <Grid />
      </div>
    </SocketProvider>
  );
}

export default App;
