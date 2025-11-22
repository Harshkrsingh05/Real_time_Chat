'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen: any;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Create or update user profile in Firestore
  const createUserProfile = async (user: User, additionalData?: any) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user profile
        console.log('Creating new user profile for:', user.email);
        const { displayName, email, photoURL } = user;
        const profile: any = {
          email: email!,
          displayName: displayName || email!.split('@')[0],
          isOnline: true,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
          ...additionalData,
        };

        // Only add photoURL if it exists (not null or undefined)
        if (photoURL) {
          profile.photoURL = photoURL;
        }

        await setDoc(userRef, profile);
        console.log('User profile created successfully');
        return { uid: user.uid, ...profile };
      } else {
        // Update existing user's online status
        console.log('Updating existing user profile for:', user.email);
        await updateDoc(userRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
        });
        return { uid: user.uid, ...userSnap.data() } as UserProfile;
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      
      // If it's a permissions error, return a basic profile without saving to Firestore
      if (error instanceof Error && error.message.includes('permissions')) {
        console.log('Permissions error, returning basic profile');
        return {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          photoURL: user.photoURL || undefined,
          isOnline: true,
          lastSeen: new Date() as any,
          createdAt: new Date() as any,
        };
      }
      throw error;
    }
  };

  // Set user offline when they leave
  const setUserOffline = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting user offline:', error);
      // Don't throw error as this is called during cleanup
    }
  };

  useEffect(() => {
    console.log('Setting up Firebase auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
      
      try {
        if (user) {
          console.log('Creating user profile for:', user.email);
          const profile = await createUserProfile(user);
          setUserProfile(profile);
          setUser(user);
        } else {
          if (userProfile?.uid) {
            await setUserOffline(userProfile.uid);
          }
          setUserProfile(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    // Set user offline when window is closed
    const handleBeforeUnload = () => {
      if (userProfile?.uid) {
        navigator.sendBeacon('/api/user-offline', JSON.stringify({ uid: userProfile.uid }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userProfile?.uid]);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in with email:', email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.email);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    console.log('Attempting to sign up with email:', email);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      await createUserProfile(user, { displayName });
      console.log('Sign up successful:', user.email);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    console.log('Attempting to sign in with Google');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign in successful:', result.user.email);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (userProfile?.uid) {
      await setUserOffline(userProfile.uid);
    }
    await firebaseSignOut(auth);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, data);
    
    if (userProfile) {
      setUserProfile({ ...userProfile, ...data });
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};