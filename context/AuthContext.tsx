
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AppUser } from '../types';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateReputation: (increment: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Escuchar cambios de estado de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Buscar perfil extendido en Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as AppUser);
        } else {
          // Si por alguna razón no existe el doc pero sí el auth, lo creamos
          const newUser: AppUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "Usuario de Bahía",
            email: firebaseUser.email || "",
            avatar: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/200`,
            reputation: 100,
            isAnonymous: false
          };
          await setDoc(doc(db, "users", firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser: AppUser = {
        id: res.user.uid,
        name,
        email,
        avatar: `https://picsum.photos/seed/${res.user.uid}/200`,
        reputation: 100,
        isAnonymous: false
      };
      // Guardar perfil en Firestore
      await setDoc(doc(db, "users", res.user.uid), newUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, "users", res.user.uid));
      
      if (!userDoc.exists()) {
        const newUser: AppUser = {
          id: res.user.uid,
          name: res.user.displayName || "Usuario Google",
          email: res.user.email || "",
          avatar: res.user.photoURL || `https://picsum.photos/seed/${res.user.uid}/200`,
          reputation: 100,
          isAnonymous: false
        };
        await setDoc(doc(db, "users", res.user.uid), newUser);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => signOut(auth);

  const updateReputation = async (increment: number) => {
    if (!user) return;
    const userRef = doc(db, "users", user.id);
    const newRep = user.reputation + increment;
    await updateDoc(userRef, { reputation: newRep });
    setUser({ ...user, reputation: newRep });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      register, 
      loginWithGoogle,
      logout,
      updateReputation
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
