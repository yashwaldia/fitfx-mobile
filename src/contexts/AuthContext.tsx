import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { getUserProfile } from '../services/firestoreService';
import type { UserProfile } from '../types/auth';

// ============================================
// TYPES
// ============================================

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  hasProfile: boolean;
  checkUserProfile: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  hasProfile: false,
  checkUserProfile: async () => {},
});

// ============================================
// HOOK (exported from here, not separate file)
// ============================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  const checkUserProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setHasProfile(false);
      return;
    }

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      setHasProfile(!!profile);
      console.log('✅ Profile check:', profile ? 'Found' : 'Not found');
    } catch (error) {
      console.error('❌ Error checking user profile:', error);
      setUserProfile(null);
      setHasProfile(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.uid || 'logged out');
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in, check for profile
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          setHasProfile(!!profile);
          console.log('✅ Profile loaded:', profile ? 'Yes' : 'No');
        } catch (error) {
          console.error('❌ Error fetching user profile:', error);
          setUserProfile(null);
          setHasProfile(false);
        }
      } else {
        // User is signed out
        setUserProfile(null);
        setHasProfile(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        hasProfile,
        checkUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
