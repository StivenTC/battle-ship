import type { FC } from "react";
import styles from "./WaitingRoom.module.scss";

interface WaitingRoomProps {
  gameId: string;
}

export const WaitingRoom: FC<WaitingRoomProps> = ({ gameId }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>ESTACIÓN DE COMBATE</h2>

      <div className={styles.scannerWrapper}>
        <div className={styles.sonarEmitter}>
          <div className={styles.sonarWave} />
          <div className={styles.sonarWave} style={{ animationDelay: "1s" }} />
        </div>
        <div className={styles.codeDisplay}>
          <span className={styles.codeLabel}>CÓDIGO DE ACCESO</span>
          <h1 className={styles.code}>{gameId}</h1>
        </div>
      </div>

      <p className={styles.status}>ESPERANDO JUGADOR RIVAL...</p>
    </div>
  );
};
