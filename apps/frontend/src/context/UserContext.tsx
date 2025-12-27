import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface UserContextType {
  userId: string;
  playerName: string | null;
  setPlayerName: (name: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore Name
    const storedName = localStorage.getItem("player_name");
    if (storedName) {
      setPlayerNameState(storedName);
    }

    // Restore or Create User ID
    let storedId = localStorage.getItem("user_id");
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem("user_id", storedId);
    }
    setUserId(storedId);

    setIsLoading(false);
  }, []);

  const setPlayerName = (name: string) => {
    localStorage.setItem("player_name", name);
    setPlayerNameState(name);
  };

  return (
    <UserContext.Provider value={{ userId, playerName, setPlayerName, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
