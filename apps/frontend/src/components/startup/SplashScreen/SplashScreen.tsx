import { useEffect, useState } from "react";
import styles from "./SplashScreen.module.scss";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onFinish();
    }, 2000); // 2 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div className={styles.splashContainer}>
      <h1 className={styles.logo}>BATTLESHIP</h1>
      <p className={styles.subtitle}>TACTICAL WARFARE</p>
    </div>
  );
};
