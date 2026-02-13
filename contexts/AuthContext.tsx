import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/lib/firebase';
import { iotaService } from '../services/iotaService';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect logic removed in favor of Popup


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (!userDoc.exists() || !userDoc.data().iotaAddress) {
                        const { address, privateKey } = await iotaService.createBurnerWallet();
                        await setDoc(userDocRef, {
                            email: user.email,
                            iotaAddress: address,
                            iotaPrivateKey: privateKey, // Saving key for Consignment Service (Cloud) access
                            isWalletBackedUp: false,
                            createdAt: new Date().toISOString()
                        }, { merge: true });
                        localStorage.setItem(`iota_sk_${user.uid}`, privateKey);
                    }
                } catch (err: any) {
                    console.error("Error checking/creating IOTA account:", err);
                    setError(err.message || "Failed to create IOTA account.");
                }
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);



    const signInWithGoogle = async () => {
        setError(null);
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error("Error signing in with Google", err);
            setError(err.message || "Failed to initiate Google Login.");
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setError(null);
        } catch (err: any) {
            console.error("Error signing out", err);
            setError(err.message);
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, loading, error, signInWithGoogle, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
