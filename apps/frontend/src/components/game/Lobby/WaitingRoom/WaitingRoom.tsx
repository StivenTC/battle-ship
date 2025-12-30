import type { FC } from "react";
import { TEXTS } from "../../../../constants/texts";
import styles from "./WaitingRoom.module.scss";

interface WaitingRoomProps {
  gameId: string;
}

export const WaitingRoom: FC<WaitingRoomProps> = ({ gameId }) => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>{TEXTS.WAITING_ROOM.TITLE}</h2>

      <div className={styles.scannerWrapper}>
        <div className={styles.sonarEmitter}>
          <div className={styles.sonarWave} />
          <div className={styles.sonarWave} style={{ animationDelay: "1s" }} />
        </div>
        <div className={styles.codeDisplay}>
          <span className={styles.codeLabel}>{TEXTS.WAITING_ROOM.CODE_LABEL}</span>
          <h1 className={styles.code}>{gameId}</h1>
        </div>
      </div>

      <output className={styles.status}>{TEXTS.WAITING_ROOM.STATUS}</output>
    </section>
  );
};
