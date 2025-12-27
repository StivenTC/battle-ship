import type { ChangeEvent, FC } from "react";
import { useState } from "react";
import styles from "./LobbyScreen.module.scss";

interface LobbyScreenProps {
  onCreate: () => void;
  onJoin: (gameId: string) => void;
  error: string | null;
  loading: boolean;
}

export const LobbyScreen: FC<LobbyScreenProps> = ({ onCreate, onJoin, error, loading }) => {
  const [joinId, setJoinId] = useState("");

  return (
    <div className={styles.lobbyWrapper}>
      <h2 className={styles.title}>Centro de Mando</h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles["button--primary"]}`}
          onClick={onCreate}
          disabled={loading}>
          {loading ? "Creando..." : "Crear Nueva Partida"}
        </button>

        <div className={styles.divider}>o</div>

        <div className={styles.inputGroup}>
          <input
            className={styles.input}
            type="text"
            placeholder="ID de Partida (4 Letras)"
            value={joinId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setJoinId(e.target.value.toUpperCase())}
            maxLength={4}
          />
          <button
            type="button"
            className={styles.button}
            onClick={() => onJoin(joinId)}
            disabled={!joinId || loading}>
            Unirse
          </button>
        </div>
      </div>
    </div>
  );
};
