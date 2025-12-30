import { useState } from "react";
import { useUser } from "../../../context/UserContext";
import { useGame } from "../../../hooks/useGame";
import { TEXTS } from "../../../constants/texts";
import styles from "./GameHeader.module.scss";

export const GameHeader = () => {
  const { gameState } = useGame();
  const { playerName } = useUser();
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Effect to flash header on damage (placeholder logic based on turn change or hits)
  // For now we'll just leave the state ready for future "Event" bus or prop

  const copyRoomCode = () => {
    if (gameState?.id) {
      navigator.clipboard.writeText(gameState.id);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <header className={styles.header}>
      {/* LEFT: Logo */}
      <div className={styles.logoSection}>
        <h1 className={styles.gameTitle}>{TEXTS.GAME_TITLE}</h1>
      </div>

      {/* CENTER: Room Info */}
      {gameState?.id && (
        <div className={styles.roomSection}>
          <span className={styles.roomCode}>
            {copyFeedback ? TEXTS.HEADER.COPY_FEEDBACK : gameState.id}
          </span>
          <button
            type="button"
            className={styles.copyBtn}
            onClick={copyRoomCode}
            aria-label={TEXTS.HEADER.COPY_BTN_TITLE}
            title={TEXTS.HEADER.COPY_BTN_TITLE}>
            📋
          </button>
        </div>
      )}

      {/* RIGHT: Player Info */}
      <div className={styles.playerSection}>
        <span className={styles.playerName}>{playerName || TEXTS.HEADER.DEFAULT_PLAYER_NAME}</span>
        <div
          className={styles.connectionDot}
          title={TEXTS.HEADER.CONNECTED_TITLE}
          aria-label={TEXTS.HEADER.CONNECTED_TITLE}
          role="status"
        />
      </div>
    </header>
  );
};
