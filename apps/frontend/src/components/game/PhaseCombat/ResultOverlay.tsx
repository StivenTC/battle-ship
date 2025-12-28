import clsx from "clsx";
import styles from "./ResultOverlay.module.scss";

interface ResultOverlayProps {
  winnerId: string | undefined;
  myPlayerId: string;
  onExit: () => void;
}

export const ResultOverlay = ({ winnerId, myPlayerId, onExit }: ResultOverlayProps) => {
  const isVictory = winnerId === myPlayerId;

  return (
    <div className={styles.overlay}>
      <div
        className={clsx(styles.card, { [styles.victory]: isVictory, [styles.defeat]: !isVictory })}>
        <h1 className={styles.title}>{isVictory ? "VICTORIA" : "DERROTA"}</h1>
        <p className={styles.subtitle}>
          {isVictory
            ? "¡Has dominado los mares! La flota enemiga ha sido erradicada."
            : "Tu flota ha caído. Retirada estratégica inminente."}
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
