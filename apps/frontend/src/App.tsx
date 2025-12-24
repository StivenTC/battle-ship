import { Grid } from "./components/game/Grid/Grid";
import "./index.scss";

function App() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Battleship</h1>
      <Grid />
    </div>
  );
}

export default App;
