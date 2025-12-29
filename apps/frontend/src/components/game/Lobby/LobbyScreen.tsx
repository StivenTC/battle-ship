import type { ChangeEvent, FC } from "react";
import { useState } from "react";
import { TEXTS } from "../../../constants/texts";
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
    <section className={styles.lobbyWrapper}>
      <h2 className={styles.title}>{TEXTS.LOBBY.TITLE}</h2>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles["button--primary"]}`}
          onClick={onCreate}
          disabled={loading}>
          {loading ? TEXTS.LOBBY.CREATING : TEXTS.LOBBY.CREATE_BTN}
        </button>

        <div className={styles.divider}>{TEXTS.LOBBY.DIVIDER}</div>

        <form
          className={styles.inputGroup}
          onSubmit={(e) => {
            e.preventDefault();
            if (joinId) onJoin(joinId);
          }}>
          <input
            className={styles.input}
            type="text"
            placeholder={TEXTS.LOBBY.INPUT_PLACEHOLDER}
            aria-label="ID de Partida"
            value={joinId}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setJoinId(e.target.value.toUpperCase())}
            maxLength={4}
          />
          <button type="submit" className={styles.button} disabled={!joinId || loading}>
            {TEXTS.LOBBY.JOIN_BTN}
          </button>
        </form>
      </div>
    </section>
  );
};
