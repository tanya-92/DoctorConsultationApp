"use client"

import { useState, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth"
import { useRouter } from "next/navigation"
export default function AdminProfile() {
  const [user] = useAuthState(auth)
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    age: 0,
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const router = useRouter()


  // 🔹 Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) {
        const data = snap.data()
        setProfileForm((prev) => ({
          ...prev,
          fullName: data.fullName || "",
          age: data.age || 0,
          phone: data.phone || "",
          email: user.email || "",
        }))
      }
    }
    fetchData()
  }, [user])

  // 🔹 Handle input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) || 0 : value,
    }))
    setFormErrors((prev) => ({ ...prev, [name]: "" }))
  }

  // 🔹 Validate
  const validateForm = () => {
    const errors: { [key: string]: string } = {}
    if (!profileForm.fullName.trim()) errors.fullName = "Full name is required"
    if (profileForm.age <= 0) errors.age = "Age must be positive"
    if (profileForm.phone && !/^\d{10}$/.test(profileForm.phone))
      errors.phone = "Phone must be 10 digits"

    if (profileForm.newPassword || profileForm.currentPassword || profileForm.confirmPassword) {
      if (!profileForm.currentPassword) errors.currentPassword = "Current password required"
      if (!profileForm.newPassword) errors.newPassword = "New password required"
      else if (profileForm.newPassword.length < 6) errors.newPassword = "At least 6 characters"
      if (profileForm.newPassword !== profileForm.confirmPassword)
        errors.confirmPassword = "Passwords do not match"
    }
    return errors
  }


  const handleSave = async () => {
  const errors = validateForm()
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors)
    return
  }

  if (!user) return
  setLoading(true)

  try {
    // Update firestore
    await updateDoc(doc(db, "users", user.uid), {
      fullName: profileForm.fullName,
      age: profileForm.age,
      phone: profileForm.phone,
    })

    // Update password if required
    if (profileForm.newPassword) {
      const cred = EmailAuthProvider.credential(user.email!, profileForm.currentPassword)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, profileForm.newPassword)
    }

    alert("✅ Profile updated successfully")

    // Reset password fields
    setProfileForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }))

    // 🔹 Redirect to Dashboard
    router.push("/admin")

  } catch (err: any) {
    console.error(err)
    alert("❌ " + err.message)
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Admin Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" name="fullName" value={profileForm.fullName} onChange={handleChange} />
            {formErrors.fullName && <p className="text-red-500 text-sm">{formErrors.fullName}</p>}
          </div>

          {/* Age */}
          <div>
            <Label htmlFor="age">Age *</Label>
            <Input type="number" id="age" name="age" value={profileForm.age} onChange={handleChange} />
            {formErrors.age && <p className="text-red-500 text-sm">{formErrors.age}</p>}
          </div>

          {/* Phone (optional) */}
          <div>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input id="phone" name="phone" value={profileForm.phone} onChange={handleChange} />
            {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
          </div>

          {/* Email (disabled) */}
          <div>
            <Label>Email</Label>
            <Input value={profileForm.email} disabled />
          </div>

          <hr className="my-6" />

          {/* Password Change */}
          <h3 className="text-lg font-semibold">Change Password</h3>

          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input type="password" id="currentPassword" name="currentPassword" value={profileForm.currentPassword} onChange={handleChange} />
            {formErrors.currentPassword && <p className="text-red-500 text-sm">{formErrors.currentPassword}</p>}
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input type="password" id="newPassword" name="newPassword" value={profileForm.newPassword} onChange={handleChange} />
            {formErrors.newPassword && <p className="text-red-500 text-sm">{formErrors.newPassword}</p>}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input type="password" id="confirmPassword" name="confirmPassword" value={profileForm.confirmPassword} onChange={handleChange} />
            {formErrors.confirmPassword && <p className="text-red-500 text-sm">{formErrors.confirmPassword}</p>}
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full mt-4">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
