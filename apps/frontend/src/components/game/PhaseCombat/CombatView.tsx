import { useState, useEffect } from "react";
import clsx from "clsx";
import { Grid } from "../Grid/Grid";
import { RadarGrid } from "./RadarGrid";
import { useGame } from "../../../hooks/useGame";
import { useUser } from "../../../context/UserContext";
import styles from "./CombatView.module.scss";

export const CombatView = () => {
  const { gameState, playerId, actions } = useGame();
  const { playerName } = useUser();

  // View state: "FRIENDLY" | "ENEMY"
  const [activeView, setActiveView] = useState<"FRIENDLY" | "ENEMY">("ENEMY");

  // Auto-switch based on turn
  useEffect(() => {
    if (!gameState || !playerId) return;

    if (gameState.turn === playerId) {
      setActiveView("ENEMY");
    } else {
      setActiveView("FRIENDLY");
    }
  }, [gameState?.turn, playerId]);

  if (!gameState || !playerId) return null;

  const isMyTurn = gameState.turn === playerId;
  const myPlayer = gameState.players[playerId];

  const turnStatus = isMyTurn ? "TU TURNO - ATACAR" : `TURNO DE ${gameState.turn} - DEFENDER`;
  const actionStatus = isMyTurn ? "Selecciona una celda enemiga" : "Esperando impacto...";

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.turnIndicator}>
          <span className={clsx(styles.turnBadge, { [styles.myTurn]: isMyTurn })}>
            {turnStatus}
          </span>
        </div>
        <div className={styles.statusLine}>{actionStatus}</div>
      </header>

      {/* CAROUSEL / GRID AREA */}
      <div className={styles.carouselArea}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={clsx(styles.toggleBtn, { [styles.active]: activeView === "FRIENDLY" })}
            onClick={() => setActiveView("FRIENDLY")}>
            MI FLOTA (Azul)
          </button>
          <button
            type="button"
            className={clsx(styles.toggleBtn, { [styles.active]: activeView === "ENEMY" })}
            onClick={() => setActiveView("ENEMY")}>
            RADAR ENEMIGO (Rojo)
          </button>
        </div>

        <div className={styles.gridContainer}>
          {activeView === "FRIENDLY" ? (
            <div className={styles.friendlyGrid}>
              {/* My Grid: Shows my ships and where I've been hit */}
              <Grid />
            </div>
          ) : (
            <div className={styles.enemyGrid}>
              <RadarGrid />
            </div>
          )}
        </div>
      </div>

      {/* ACTION DRAWER */}
      <footer className={styles.actionDrawer}>
        <div className={styles.apDisplay}>
          <span className={styles.apLabel}>ENERGÍA (AP)</span>
          <div className={styles.apBar}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`ap-${i}`}
                className={clsx(styles.apPip, { [styles.filled]: i < (myPlayer?.ap || 0) })}
              />
            ))}
          </div>
          <span className={styles.apValue}>{myPlayer?.ap || 0}/6</span>
        </div>

        <div className={styles.skills}>
          <button type="button" className={styles.skillBtn} disabled>
            HABILIDAD 1
          </button>
          <button type="button" className={styles.skillBtn} disabled>
            HABILIDAD 2
          </button>
          <button type="button" className={styles.skillBtn} disabled>
            HABILIDAD 3
          </button>
        </div>
      </footer>
    </div>
  );
};
