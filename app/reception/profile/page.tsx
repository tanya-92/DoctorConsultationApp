"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReceptionProfilePage() {
  const [user] = useAuthState(auth);
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 Fetch existing data
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setFullName(data.fullName || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // 🔹 Save profile (name/email/phone)
  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        phone,
      });
      router.push("/reception/overview"); // ✅ Redirect after save
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

  // 🔹 Change Password
  const handleChangePassword = async () => {
    if (!user?.email) return;
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      alert("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Error changing password:", err);
      setError(err.message);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Profile Settings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Reception Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              disabled 
            />
          </div>

          {/* Phone (optional) */}
          <div className="space-y-2">
            <Label>Phone (Optional)</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <Button onClick={handleSaveProfile} className="w-full mt-4">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            className="w-full mt-4"
          >
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
