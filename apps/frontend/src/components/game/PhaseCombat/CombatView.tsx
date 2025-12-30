import { useState, useEffect } from "react";
import clsx from "clsx";
import { Grid } from "../Grid/Grid";
import { RadarGrid } from "./RadarGrid";
import { useGame } from "../../../hooks/useGame";
import { useUser } from "../../../context/UserContext";
import styles from "./CombatView.module.scss";
import { SKILLS, type SkillName } from "@battle-ship/shared";
import { ResultOverlay } from "./ResultOverlay";
import { TEXTS } from "../../../constants/texts";

export const CombatView = () => {
  const { gameState, playerId, actions } = useGame();
  const { playerName } = useUser();

  const [activeView, setActiveView] = useState<"FRIENDLY" | "ENEMY">("ENEMY");
  const [hasInitializedView, setHasInitializedView] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [prevTurn, setPrevTurn] = useState<string | null>(null);

  useEffect(() => {
    if (gameState && playerId && !hasInitializedView) {
      const isMyTurn = gameState.turn === playerId;
      setActiveView(isMyTurn ? "ENEMY" : "FRIENDLY");
      setHasInitializedView(true);
    }
  }, [gameState, playerId, hasInitializedView]);

  const [selectedSkill, setSelectedSkill] = useState<SkillName | null>(null);
  const [previewCenter, setPreviewCenter] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!gameState || !playerId) return;

    if (gameState.turn !== prevTurn) {
      if (prevTurn === playerId && gameState.turn !== playerId) {
        setFeedback(TEXTS.COMBAT.FEEDBACK.ATTACK_RESULTS);
        setTimeout(() => {
          setActiveView("FRIENDLY");
          setFeedback(TEXTS.COMBAT.FEEDBACK.DEFENSE_TURN);
          setTimeout(() => setFeedback(null), 1000);
        }, 2500);
      } else if (prevTurn && prevTurn !== playerId && gameState.turn === playerId) {
        setFeedback(TEXTS.COMBAT.FEEDBACK.ENEMY_TURN_END);
        setTimeout(() => {
          setActiveView("ENEMY");
          setFeedback(TEXTS.COMBAT.FEEDBACK.MY_TURN_START);
          setTimeout(() => setFeedback(null), 1000);
        }, 2500);
      }
      setPrevTurn(gameState.turn);
    }
  }, [gameState, playerId, prevTurn]);

  const handleGridHover = (x: number, y: number) => {
    setPreviewCenter(selectedSkill ? { x, y } : null);
  };

  const handleGridLeave = () => {
    setPreviewCenter(null);
  };

  if (!gameState || !playerId) return null;

  if (gameState.winner) {
    const isWinner = gameState.winner === playerId;
    const winnerName = isWinner
      ? playerName || TEXTS.HEADER.DEFAULT_PLAYER_NAME
      : TEXTS.COMBAT.ENEMY_FLEET;

    return (
      <ResultOverlay
        winnerId={gameState.winner}
        winnerName={winnerName}
        isVictory={isWinner}
        onExit={() => window.location.reload()}
      />
    );
  }

  const isMyTurn = gameState.turn === playerId;
  const myPlayer = gameState.players[playerId];

  // Calculate friendly grid state derived from server state
  const myHits = new Set<string>();
  const myMisses = new Set<string>();

  for (const s of myPlayer.ships) {
    for (const h of s.hits) {
      myHits.add(`${h.x},${h.y}`);
    }
  }

  if (myPlayer.misses) {
    for (const m of myPlayer.misses) {
      myMisses.add(`${m.x},${m.y}`);
    }
  }

  const handleGridClick = (x: number, y: number) => {
    if (selectedSkill) {
      actions.useSkill(selectedSkill, { x, y });
      setSelectedSkill(null);
      setPreviewCenter(null);
      setFeedback(TEXTS.COMBAT.FEEDBACK.SKILL_ACTIVATED(SKILLS[selectedSkill].displayName));
      setTimeout(() => setFeedback(null), 1500);
    } else {
      actions.attack(x, y);
    }
  };

  const ap = myPlayer?.ap || 0;

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div className={styles.turnIndicator}>
          <span className={clsx(styles.turnBadge, { [styles.myTurn]: isMyTurn })}>
            {isMyTurn ? TEXTS.COMBAT.TURN_MY : TEXTS.COMBAT.TURN_ENEMY}
          </span>
        </div>
        <div className={styles.statusLine}>
          {selectedSkill
            ? `SELECCIONA OBJETIVO PARA ${SKILLS[selectedSkill].displayName}`
            : isMyTurn
              ? TEXTS.COMBAT.ACTION_MY
              : TEXTS.COMBAT.ACTION_ENEMY}
        </div>
      </header>

      <section className={styles.carouselArea} aria-label="Campo de Batalla">
        {feedback && (
          <div className={styles.feedbackOverlay} role="alert" aria-live="assertive">
            {feedback}
          </div>
        )}

        <div className={styles.gridContainer}>
          {activeView === "FRIENDLY" ? (
            <div className={styles.friendlyGrid}>
              <Grid
                variant="friendly"
                ships={myPlayer.ships}
                mines={myPlayer.placedMines}
                hits={myHits}
                misses={myMisses}
              />
            </div>
          ) : (
            <div className={styles.enemyGrid} onMouseLeave={handleGridLeave}>
              <RadarGrid
                onAttackOverride={
                  selectedSkill && SKILLS[selectedSkill].pattern !== "GLOBAL_RANDOM_3"
                    ? handleGridClick
                    : undefined
                }
                previewCenter={previewCenter}
                skillPattern={selectedSkill ? SKILLS[selectedSkill].pattern : undefined}
                onCellHover={handleGridHover}
              />
            </div>
          )}
        </div>
      </section>

      <footer className={styles.actionDrawer}>
        <div className={styles.apDisplay}>
          <span className={styles.apLabel}>⚡</span>
          <div className={styles.apBar}>
            {[0, 1, 2, 3, 4, 5].map((slot) => (
              <div
                key={`ap-${slot}`}
                className={clsx(styles.apPip, { [styles.filled]: slot < ap })}
              />
            ))}
          </div>
          <span className={styles.apValue}>{ap}/6</span>
        </div>

        <div className={styles.skills}>
          {Object.values(SKILLS)
            .filter((skill) => {
              const ship = myPlayer.ships.find((s) => s.type === skill.linkedShip);
              return ship && !ship.isSunk;
            })
            .map((skill) => (
              <button
                key={skill.id}
                type="button"
                className={clsx(styles.skillBtn, { [styles.active]: selectedSkill === skill.id })}
                disabled={ap < skill.cost || !isMyTurn}
                onClick={() => {
                  if (skill.pattern === "GLOBAL_RANDOM_3") {
                    if (ap >= skill.cost) {
                      actions.useSkill(skill.id, { x: 0, y: 0 });
                      setFeedback(TEXTS.COMBAT.FEEDBACK.SKILL_LAUNCHED(skill.displayName));
                      setTimeout(() => setFeedback(null), 1500);
                      setSelectedSkill(null);
                    }
                  } else {
                    setSelectedSkill(selectedSkill === skill.id ? null : skill.id);
                  }
                }}
                title={skill.description}>
                <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>
                  {skill.id === "DRONE_RECON" && "📡"}
                  {skill.id === "X_IMPACT" && "❌"}
                  {skill.id === "CHAOTIC_SALVO" && "💣"}
                  {skill.id === "SONAR_TORPEDO" && "🚀"}
                  {skill.id === "REVEALING_SHOT" && "📍"}
                </div>
                <div style={{ fontSize: "0.6rem", fontWeight: "bold" }}>
                  {skill.displayName.split(" (")[0]}
                </div>
                <div style={{ fontSize: "0.6rem", opacity: 0.7 }}>{skill.cost} ⚡</div>
              </button>
            ))}
        </div>
      </footer>
    </section>
  );
};
