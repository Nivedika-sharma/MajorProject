// src/contexts/AuthContext.tsx
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
  saveOAuthLogin: (token: string, profile: UserProfile | null) => void;
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
    console.log("🔵 AuthContext - Initializing...");
    const token = localStorage.getItem('token');
    const storedProfile = localStorage.getItem('profile');
    
    console.log("🔵 AuthContext - Token exists:", !!token);
    console.log("🔵 AuthContext - Profile exists:", !!storedProfile);
    
    if (token && storedProfile) {
      try {
        const parsedProfile = JSON.parse(storedProfile);
        console.log("🔵 AuthContext - Parsed profile:", parsedProfile);
        
        // ✅ Only set profile if it's a valid object (not null)
        if (parsedProfile && typeof parsedProfile === 'object' && parsedProfile.email) {
          setProfile(parsedProfile);
          console.log("✅ AuthContext - Profile loaded successfully");
        } else {
          console.warn("⚠️ AuthContext - Invalid profile structure, clearing");
          localStorage.removeItem('token');
          localStorage.removeItem('profile');
        }
      } catch (error) {
        console.error("❌ AuthContext - Error parsing profile:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('profile');
      }
    } else {
      console.log("🔵 AuthContext - No stored credentials found");
    }
    
    setLoading(false);
    console.log("🔵 AuthContext - Initialization complete");
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("🔵 AuthContext - Regular login attempt for:", email);
    
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
    
    console.log("✅ AuthContext - Regular login successful:", fullProfile);
  };

  const saveOAuthLogin = (token: string, userProfile: UserProfile | null) => {
    console.log("🔵 AuthContext - saveOAuthLogin called");
    console.log("🔵 AuthContext - Token length:", token?.length);
    console.log("🔵 AuthContext - Profile:", userProfile);
    
    if (!userProfile || !userProfile.email) {
      console.error("❌ AuthContext - Cannot save OAuth login: invalid profile");
      return;
    }

    try {
      localStorage.setItem("token", token);
      localStorage.setItem("profile", JSON.stringify(userProfile));
      setProfile(userProfile);
      
      console.log("✅ AuthContext - OAuth login saved successfully");
      console.log("✅ AuthContext - New profile state:", userProfile);
    } catch (error) {
      console.error("❌ AuthContext - Error saving OAuth login:", error);
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    setProfile(null);
    console.log("🔵 AuthContext - User signed out");
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