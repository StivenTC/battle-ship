import { useState } from "react";
import { useUser } from "../../../context/UserContext";
import styles from "./IdentityModal.module.scss";

export const IdentityModal = () => {
  const { setPlayerName, playerName } = useUser();
  const [name, setName] = useState("");

  if (playerName) return null; // Hide if already identified

  const handleSave = () => {
    if (name.trim().length > 0) {
      setPlayerName(name.trim());
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.title}>IDENTIFICACIÓN</h2>
        <input
          type="text"
          className={styles.input}
          placeholder="Ingresa tu nombre de Capitan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={name.trim().length === 0}
          type="button">
          INICIAR SERVICIO
        </button>
      </div>
    </div>
  );
};
