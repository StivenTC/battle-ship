import clsx from "clsx";
import styles from "./ResultOverlay.module.scss";

interface ResultOverlayProps {
  winnerId: string | undefined;
  winnerName: string;
  isVictory: boolean;
  onExit: () => void;
  // Deprecated logs, but keeping interface clean
  myPlayerId?: string;
}

export const ResultOverlay = ({ winnerId, winnerName, isVictory, onExit }: ResultOverlayProps) => {
  return (
    <div className={styles.overlay}>
      <div
        className={clsx(styles.card, { [styles.victory]: isVictory, [styles.defeat]: !isVictory })}>
        <h1 className={styles.title}>{isVictory ? "VICTORIA" : "DERROTA"}</h1>
        <p className={styles.subtitle}>
          {isVictory
            ? "¡Has dominado los mares! La flota enemiga ha sido erradicada."
            : `El ganador es: ${winnerName}. Tu flota ha caído.`}
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.exitBtn} onClick={onExit}>
            VOLVER AL LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};
