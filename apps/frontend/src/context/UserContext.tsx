import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
  playerName: string | null;
  setPlayerName: (name: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [playerName, setPlayerNameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem("player_name");
    if (storedName) {
      setPlayerNameState(storedName);
    }
    setIsLoading(false);
  }, []);

  const setPlayerName = (name: string) => {
    localStorage.setItem("player_name", name);
    setPlayerNameState(name);
  };

  return (
    <UserContext.Provider value={{ playerName, setPlayerName, isLoading }}>
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
