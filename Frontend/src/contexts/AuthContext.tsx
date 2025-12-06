import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  department?: string;
  designation?: string;
  working_hours?: string;
  avatar_url?: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
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

  // Load token from localStorage on mount
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

    const fullProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.full_name,
      department: data.user.department,
      designation: data.user.designation,
      working_hours: data.user.working_hours,
      avatar_url: data.user.avatar_url,
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('profile', JSON.stringify(fullProfile));

    setProfile(fullProfile);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
