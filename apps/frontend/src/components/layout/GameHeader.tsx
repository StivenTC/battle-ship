import clsx from "clsx";
import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { useGame } from "../../hooks/useGame";
import styles from "./GameHeader.module.scss";

export const GameHeader = () => {
  const { gameState } = useGame();
  const { playerName } = useUser();
  const [damageFlash, setDamageFlash] = useState(false);
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
    <header className={clsx(styles.header, { [styles.damage]: damageFlash })}>
      {/* LEFT: Logo */}
      <div className={styles.logoSection}>
        <h1 className={styles.gameTitle}>BATTLESHIP</h1>
      </div>

      {/* CENTER: Room Info */}
      {gameState?.id && (
        <div className={styles.roomSection}>
          <span className={styles.roomCode}>{copyFeedback ? "¡Copiado!" : gameState.id}</span>
          <button
            type="button"
            className={styles.copyBtn}
            onClick={copyRoomCode}
            title="Copiar código de sala">
            📋
          </button>
        </div>
      )}

      {/* RIGHT: Player Info */}
      <div className={styles.playerSection}>
        <span className={styles.playerName}>{playerName || "Capitán"}</span>
        <div className={styles.connectionDot} title="Conectado" />
      </div>
    </header>
  );
};
