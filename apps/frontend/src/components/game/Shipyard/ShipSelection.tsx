import { useState } from "react";
import { SHIP_CONFIG, SHIP_NAMES_ES, type ShipType } from "@battle-ship/shared";
import styles from "./ShipSelection.module.scss";

interface ShipSelectionProps {
  onConfirm: (selectedShips: ShipType[]) => void;
}

export const ShipSelection = ({ onConfirm }: ShipSelectionProps) => {
  const [selected, setSelected] = useState<ShipType[]>([]);

  const toggleShip = (type: ShipType) => {
    if (selected.includes(type)) {
      setSelected(selected.filter((s) => s !== type));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, type]);
      }
    }
  };

  const isFull = selected.length === 3;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>ASTILLERO NAVAL</h2>
      <p className={styles.subtitle}>Selecciona 3 naves para tu flota</p>

      <div className={styles.grid}>
        {(Object.keys(SHIP_CONFIG) as ShipType[]).map((type) => {
          const config = SHIP_CONFIG[type];
          const isSelected = selected.includes(type);
          const isDisabled = !isSelected && isFull;

          return (
            <button
              key={type}
              type="button"
              className={`${styles.card} ${isSelected ? styles.selected : ""} ${isDisabled ? styles.disabled : ""}`}
              onClick={() => toggleShip(type)}>
              <div className={styles.cardHeader}>
                <span className={styles.shipName}>{SHIP_NAMES_ES[type]}</span>
                <span className={styles.shipSize}>{config.size} celdas</span>
              </div>
              <div className={styles.shipPreview}>
                {/* Placeholder for Ship Asset or Icon */}
                <div className={styles[`icon-${type.toLowerCase()}`]} />
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.skillLabel}>TAB: {config.skill}</span>
                <span className={styles.costLabel}>Coste: {config.cost} AP</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        <div className={styles.counter}>
          SELECCIONADO: <strong>{selected.length}/3</strong>
        </div>
        <button
          type="button"
          className={styles.confirmButton}
          disabled={!isFull}
          onClick={() => onConfirm(selected)}>
          DESPLEGAR FLOTA
        </button>
      </div>
    </div>
  );
};
