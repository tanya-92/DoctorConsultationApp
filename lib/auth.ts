import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"; // Add updateDoc
import { auth, db } from "./firebase";

export interface UserData {
  uid: string;
  email: string;
  fullName: string;
  age: number;
  createdAt: Date;
  role?: "admin" | "receptionist" | "patient";
  phone?: string; // Optional: Add phone if you want to include it
}

export const registerUser = async (email: string, password: string, fullName: string, age: number) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    const userData: UserData = {
      uid: user.uid,
      email: user.email!,
      fullName,
      age,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), userData);

    return { user, userData };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    } else {
      return null;
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// New function to update user profile
export const updateUser = async (uid: string, data: Partial<UserData>) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Update Firebase Authentication profile (e.g., displayName)
    if (data.fullName) {
      await updateProfile(user, { displayName: data.fullName });
    }

    // Update Firestore user document
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      fullName: data.fullName || user.displayName,
      age: data.age || 0, // Provide default or fetch existing
      phone: data.phone || undefined, // Only update if provided
    });

    // Fetch updated user data
    const updatedDoc = await getDoc(docRef);
    return updatedDoc.data() as UserData;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateUserPassword = async (uid: string, currentPassword: string, newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("No authenticated user found");
    }
    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    // Update the password
    await updatePassword(user, newPassword);
  } catch (error: any) {
    if (error.code === "auth/wrong-password") {
      throw new Error("Incorrect current password");
    } else if (error.code === "auth/weak-password") {
      throw new Error("New password must be at least 6 characters long");
    } else if (error.code === "auth/requires-recent-login") {
      throw new Error("Session expired. Please log in again to change your password.");
    }
    throw new Error(error.message || "Failed to update password");
  }
};