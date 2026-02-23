import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/lib/firebase';
import { iotaService } from '../services/iotaService';
import { iotaIdentityService } from '../services/iotaIdentityService';

interface UserProfile {
    email: string;
    iotaAddress: string;
    iotaPrivateKey: string;
    iotaDID?: string;
    iotaDIDPrivateKey?: string;
    didDocumentJson?: string;
    didPublished?: boolean;
    didPublishTxId?: string;
    didExplorerUrl?: string;
    isWalletBackedUp: boolean;
    createdAt: string;
}

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    createDID: (alias: string, entityType: 'farmer' | 'retailer' | 'product' | 'certifier') => Promise<void>;
    isCreatingDID: boolean;
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
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreatingDID, setIsCreatingDID] = useState(false);

    // Initialize IOTA Identity service
    useEffect(() => {
        iotaIdentityService.initialize();
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    const userData = userDoc.data() as UserProfile | undefined;

                    if (!userData) {
                        // New user - create wallet and optionally DID
                        const { address, privateKey } = await iotaService.createBurnerWallet();
                        
                        const newUserProfile: UserProfile = {
                            email: user.email || '',
                            iotaAddress: address,
                            iotaPrivateKey: privateKey,
                            isWalletBackedUp: false,
                            createdAt: new Date().toISOString()
                        };

                        await setDoc(userDocRef, newUserProfile, { merge: true });
                        localStorage.setItem(`iota_sk_${user.uid}`, privateKey);
                        
                        setUserProfile(newUserProfile);
                    } else {
                        // Existing user - load profile
                        setUserProfile(userData);
                        
                        // Ensure wallet key is in localStorage
                        if (userData.iotaPrivateKey) {
                            localStorage.setItem(`iota_sk_${user.uid}`, userData.iotaPrivateKey);
                        }
                    }
                } catch (err: any) {
                    console.error("Error checking/creating IOTA account:", err);
                    setError(err.message || "Failed to create IOTA account.");
                }
            } else {
                setUserProfile(null);
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
            setUserProfile(null);
            setError(null);
        } catch (err: any) {
            console.error("Error signing out", err);
            setError(err.message);
        }
    };

    const createDID = async (
        alias: string, 
        entityType: 'farmer' | 'retailer' | 'product' | 'certifier'
    ) => {
        if (!currentUser || !userProfile) {
            setError("You must be logged in to create a DID");
            return;
        }

        setIsCreatingDID(true);
        setError(null);

        try {
            console.log(`[AuthContext] Creating IOTA DID for: ${alias}`);

            // Create DID using IOTA Identity Service
            const { did, privateKey, documentJson } = await iotaIdentityService.createDID(
                alias, 
                entityType
            );

            // Publish DID to Tangle (simulated)
            const publishResult = await iotaIdentityService.publishDID(documentJson, privateKey);

            console.log(`[AuthContext] DID Published:`, publishResult);

            // Update user profile with DID
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
                iotaDID: did,
                iotaDIDPrivateKey: privateKey,
                didDocumentJson: documentJson,
                didPublished: publishResult.status === 'published',
                didPublishTxId: publishResult.transactionId,
                didExplorerUrl: publishResult.explorerUrl
            }, { merge: true });

            // Update local state
            setUserProfile(prev => prev ? ({
                ...prev,
                iotaDID: did,
                iotaDIDPrivateKey: privateKey,
                didDocumentJson: documentJson
            }) : null);

            console.log(`[AuthContext] ✓ DID created and saved: ${did}`);
        } catch (err: any) {
            console.error("[AuthContext] Error creating DID:", err);
            setError(err.message || "Failed to create DID.");
        } finally {
            setIsCreatingDID(false);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            currentUser, 
            userProfile,
            loading, 
            error, 
            signInWithGoogle, 
            logout,
            createDID,
            isCreatingDID
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
