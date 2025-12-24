import { useState } from "react";
import styles from "./App.module.scss";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className={styles.app}>
      <h1>Battle Ship</h1>
      <div className={styles.app__card}>
        {/* BEM naming convention inside module */}
        <button
          className={styles.app__button}
          type="button"
          onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
