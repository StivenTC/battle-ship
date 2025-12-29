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

  // View state: "FRIENDLY" | "ENEMY"
  const [activeView, setActiveView] = useState<"FRIENDLY" | "ENEMY">("ENEMY");

  // Feedback Log State
  const [feedback, setFeedback] = useState<string | null>(null);

  // Detect Turn Change & Hits
  const [prevTurn, setPrevTurn] = useState<string | null>(null);

  // Skill Selection State
  const [selectedSkill, setSelectedSkill] = useState<SkillName | null>(null);
  const [previewCenter, setPreviewCenter] = useState<{ x: number; y: number } | null>(null);

  // Transition Logic & Feedback
  useEffect(() => {
    if (!gameState || !playerId) return;

    // Detect Turn Change
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

  // Handle Ghost Preview on Mouse Move
  const handleGridHover = (x: number, y: number) => {
    if (selectedSkill) {
      setPreviewCenter({ x, y });
    } else {
      setPreviewCenter(null);
    }
  };

  const handleGridLeave = () => {
    setPreviewCenter(null);
  };

  if (!gameState || !playerId) return null;

  // HANDLE GAME OVER
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

  const turnStatus = isMyTurn ? TEXTS.COMBAT.TURN_MY : TEXTS.COMBAT.TURN_ENEMY;
  const actionStatus = isMyTurn ? TEXTS.COMBAT.ACTION_MY : TEXTS.COMBAT.ACTION_ENEMY;

  // Wrap generic attack action to handle skills if selected
  const handleGridClick = (x: number, y: number) => {
    if (selectedSkill) {
      actions.useSkill(selectedSkill, { x, y });
      setSelectedSkill(null); // Reset after use
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
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.turnIndicator}>
          <span className={clsx(styles.turnBadge, { [styles.myTurn]: isMyTurn })}>
            {turnStatus}
          </span>
        </div>
        <div className={styles.statusLine}>
          {selectedSkill
            ? `SELECCIONA OBJETIVO PARA ${SKILLS[selectedSkill].displayName}`
            : actionStatus}
        </div>
      </header>

      {/* GRID AREA */}
      <section className={styles.carouselArea} aria-label="Campo de Batalla">
        {feedback && (
          <div className={styles.feedbackOverlay} role="alert" aria-live="assertive">
            {feedback}
          </div>
        )}

        <div className={styles.gridContainer}>
          {activeView === "FRIENDLY" ? (
            <div className={styles.friendlyGrid}>
              <Grid variant="friendly" />
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

      {/* ACTION DRAWER */}
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
              // Show only if we have the linked ship and it's not sunk
              const ship = myPlayer.ships.find((s) => s.type === skill.linkedShip);
              return ship && !ship.isSunk;
            })
            .map((skill) => (
              <button
                key={skill.id}
                type="button"
                className={clsx(styles.skillBtn, { [styles.active]: selectedSkill === skill.id })}
                disabled={ap < skill.cost}
                onClick={() => {
                  if (skill.pattern === "GLOBAL_RANDOM_3") {
                    // Immediate execution for Bombardeo
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
                {/* 
                  TODO: Replace with monochrome SVG icons. 
                  For now, using cleaned up text/emoji. 
                */}
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
