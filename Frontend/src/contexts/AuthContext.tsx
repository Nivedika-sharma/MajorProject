import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface UserProfile {
  id?: string;
  email: string;
  full_name: string;
  avatar?: string;
  avatar_url?: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  saveOAuthLogin: (token: string, profile: UserProfile) => void;
  getAuthToken: () => string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedProfile = localStorage.getItem('profile');
    if (token && storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Invalid credentials');
    }

    const data = await res.json();
    const fullProfile: UserProfile = { ...data.user };

    localStorage.setItem('token', data.token);
    localStorage.setItem('profile', JSON.stringify(fullProfile));
    setProfile(fullProfile);
  };

  const saveOAuthLogin = (token: string, userProfile: UserProfile) => {
    localStorage.setItem("token", token);
    localStorage.setItem("profile", JSON.stringify(userProfile));
    setProfile(userProfile);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    setProfile(null);
  };

  const getAuthToken = () => localStorage.getItem('token');

  return (
    <AuthContext.Provider
      value={{
        profile,
        signIn,
        signOut,
        loading,
        saveOAuthLogin,
        getAuthToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
