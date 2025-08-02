"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

export function useUserRole() {
  const [user] = useAuthState(auth)
  const [role, setRole] = useState("patient") // default
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchRole = async () => {
      const userRef = doc(db, "users", user.uid)
      const snap = await getDoc(userRef)
      if (snap.exists()) {
        setRole(snap.data().role || "patient")
      }
      setLoading(false)
    }

    fetchRole()
  }, [user])

  const updateRole = async (newRole: string) => {
    if (!user) return
    await setDoc(doc(db, "users", user.uid), { role: newRole }, { merge: true })
    setRole(newRole)
  }

  return { role, updateRole, loading }
}