import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserData {
  uid: string;
  email: string;
  fullName: string;
  age: number;
  createdAt: Date;
  role?: "admin" | "receptionist" | "patient";
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
    // Clear token cookie on the client side (for client-side calls)
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