import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { userManagement } from "@/utils/localStorageManager";

type UserType = {
  id: number;
  name: string;
  email: string;
  username: string;
  profileImage?: string;
  city?: string;
  bio?: string;
  website?: string;
  userType?: string;
  points?: number;
  level?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserType>;
  register: (userData: Partial<UserType>) => Promise<UserType>;
  logout: () => void;
  updateUser: (data: Partial<UserType>) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, load user from localStorage
  useEffect(() => {
    setIsLoading(true);
    try {
      const currentUser = userManagement.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Error loading user from storage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<UserType> => {
    try {
      const loggedInUser = userManagement.login(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: Partial<UserType>): Promise<UserType> => {
    try {
      const newUser = userManagement.register(userData);
      setUser(newUser);
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    userManagement.logout();
    setUser(null);
  };

  const updateUser = (data: Partial<UserType>) => {
    if (!user) return;
    
    try {
      userManagement.updateUser(user.id, data);
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}