"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "patient" | "receptionist";
}

export default function AdminDashboardWithRoleControl() {
  const [user] = useAuthState(auth);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const data: UserRecord[] = usersSnapshot.docs.map((docSnap) => {
      const docData = docSnap.data();
      const { id: _id, ...rest } = docData; // avoid duplicate id assignment
      return {
        id: docSnap.id,
        ...(rest as Omit<UserRecord, "id">),
      };
    });
    setAllUsers(data);
  };

  const handleRoleChange = async (uid: string, role: UserRecord["role"]) => {
    setUpdating(uid);
    await updateDoc(doc(db, "users", uid), { role });
    await fetchUsers();
    setUpdating(null);
  };

  const filtered = allUsers.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card className="mt-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
        <Input
          placeholder="Search by email"
          className="mt-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2">Full Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td className="p-2">{user.fullName}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2 capitalize">{user.role}</td>
                  <td className="p-2">
                    <select
                      className="border px-2 py-1 rounded"
                      value={user.role}
                      disabled={updating === user.id}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as UserRecord["role"])
                      }
                    >
                      <option value="patient">Patient</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}