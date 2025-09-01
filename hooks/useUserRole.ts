// hooks/useUserRole.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

const SUPERADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "drnitinmishraderma@gmail.com";

export function useUserRole() {
  const [user] = useAuthState(auth);
  const [role, setRole] = useState<"patient" | "receptionist" | "admin">(
    "patient"
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const unsubRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    // Re-subscribe on token refresh (ensures claims/uid stability)
    const off = onIdTokenChanged(auth, () => {
      // no-op; this simply keeps the hook reactive to token changes
    });
    return () => off();
  }, []);

  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = undefined;
    }

    if (!user) {
      setRole("patient");
      setLoading(false);
      return;
    }

    const ref = doc(db, "users", user.uid);

    unsubRef.current = onSnapshot(
      ref,
      async (snap) => {
        try {
          // Ensure user doc exists with at least an email + default role
          if (!snap.exists()) {
            await setDoc(
              ref,
              {
                email: user.email || "",
                role: "patient",
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );
            setRole("patient");
            setLoading(false);
            return;
          }

          const data = snap.data() as any;
          let nextRole: "patient" | "receptionist" | "admin" =
            (data.role as any) || "patient";

          // Superadmin is *always* admin on the client
          if (user.email === SUPERADMIN_EMAIL && nextRole !== "admin") {
            // Heal bad writes automatically
            await setDoc(ref, { role: "admin" }, { merge: true });
            nextRole = "admin";
          }

          setRole(nextRole);
          setLoading(false);

          // Handle forced logout for *any* role (works for admin→patient case too)
          if (data.forceLogout === true) {
            // Flip the flag off so user doesn't get stuck in a loop
            await setDoc(
              ref,
              {
                forceLogout: false,
                forceLogoutAt: serverTimestamp(),
              },
              { merge: true }
            );

            // Sign out and send to login
            await signOut(auth);
            router.push("/login");
          }
        } catch (e) {
          console.error("useUserRole snapshot error:", e);
          setLoading(false);
        }
      },
      (err) => {
        console.error("useUserRole onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = undefined;
      }
    };
  }, [user, router]);

  const updateRole = async (newRole: "patient" | "receptionist" | "admin") => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, { role: newRole }, { merge: true });
    setRole(newRole);
  };

  return { role, updateRole, loading };
}
