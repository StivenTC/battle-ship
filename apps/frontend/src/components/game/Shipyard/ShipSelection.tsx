import { useState } from "react";
import { SHIP_CONFIG, SHIP_NAMES_ES, type ShipType } from "@battle-ship/shared";
import { ShipAsset } from "../Ships/ShipAssets";
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
      <p className={styles.subtitle}>Desliza y selecciona 3 naves</p>

      <div className={styles.carouselWrapper}>
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
                <div className={styles.sizeIndicator}>
                  {Array.from({ length: config.size }, (_, i) => i).map((pipIndex) => (
                    <div key={`pip-${type}-${pipIndex}`} className={styles.sizePip} />
                  ))}
                </div>
              </div>

              <div className={styles.shipPreview}>
                <ShipAsset type={type} style={{ width: "90%", height: "auto" }} />
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.skillRow}>
                  <span className={styles.skillLabel}>{config.skill.toUpperCase()}</span>
                  <span className={styles.costLabel}>⚡ {config.cost}</span>
                </div>
                <p className={styles.skillDesc}>
                  {type === "Carrier" && "Revela un área de 3x3 sin atacar."}
                  {type === "Battleship" && "Ataque en forma de X (5 celdas)."}
                  {type === "Destroyer" && "3 disparos aleatorios al mapa."}
                  {type === "Submarine" && "Ataque en línea recta."}
                  {type === "Corvette" && "Disparo que revela si acierta."}
                </p>
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
          {isFull ? "DESPLEGAR FLOTA" : "SELECCIONA 3 NAVES"}
        </button>
      </div>
    </div>
  );
};
