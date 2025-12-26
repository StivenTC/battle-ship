import { Grid } from "./components/game/Grid/Grid";
import { SocketProvider } from "./context/SocketContext";
import "./index.scss";

function App() {
  return (
    <SocketProvider>
      <div>
        <h1 className="text-3xl font-bold mb-8">Battleship</h1>
        <Grid />
      </div>
    </SocketProvider>
  );
}

export default App;
