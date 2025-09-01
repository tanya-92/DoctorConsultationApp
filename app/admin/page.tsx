"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Users,
  DollarSign,
  MessageCircle,
  Video,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  totalRevenue: number;
  activePatients: number;
}

interface RecentActivity {
  id: string;
  type: "chat" | "appointment" | "call";
  patient: string;
  time: string;
  status: string;
}

const SUPERADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "drnitinmishraderma@gmail.com";

export default function AdminDashboard() {
  const router = useRouter();
  const [hasNewAppointment, setHasNewAppointment] = useState(false);
  const [lastNotifiedId, setLastNotifiedId] = useState("");
  const [user] = useAuthState(auth);
  const { role, loading: roleLoading } = useUserRole();
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    totalRevenue: 0,
    activePatients: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<
    Array<{ email: string; role: string; uid: string }>
  >([]);
  const [emailInput, setEmailInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<
    Array<{ email: string; role: string; uid: string }>
  >([]);

  const doctorFee = Number.parseInt(
    process.env.NEXT_PUBLIC_DOCTOR_FEE || "500"
  );

  // Toggle filter helper (unchanged)
  const isToggleDocument = (docData: any) => {
    const keys = Object.keys(docData).map((k) => k.toLowerCase());
    const isToggle =
      typeof docData.active === "boolean" &&
      keys.length === 1 &&
      !keys.includes("patientname") &&
      !keys.includes("patientemail") &&
      !keys.includes("date");
    return isToggle;
  };

  const parseAppointmentDate = (dateField: any): Date | null => {
    if (!dateField) return null;
    try {
      if (dateField && typeof dateField.toDate === "function") return dateField.toDate();
      if (typeof dateField === "string") return new Date(dateField);
      if (dateField instanceof Date) return dateField;
      if (dateField.seconds && dateField.nanoseconds !== undefined) {
        return new Date(dateField.seconds * 1000 + dateField.nanoseconds / 1e6);
      }
      return null;
    } catch {
      return null;
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchAllUsers();
    }
    const unsubscribe = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const allDocs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
      const actualAppointments = allDocs.filter((doc) => !isToggleDocument(doc.data));
      const todayAppointments = actualAppointments.filter((doc) => {
        const dt = parseAppointmentDate(doc.data.date);
        return dt ? isToday(dt) : false;
      });
      const totalAppointments = actualAppointments.length;
      const totalRevenue =
        actualAppointments.filter((doc) => doc.data.status === "completed").length * doctorFee;
      setStats((prev) => ({
        ...prev,
        todayAppointments: todayAppointments.length,
        totalAppointments,
        totalRevenue,
      }));
    });
    return () => unsubscribe();
  }, [user, doctorFee]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const appointmentsQuery = query(collection(db, "appointments"));
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const actualAppointmentDocs = appointmentsSnapshot.docs.filter(
        (d) => !isToggleDocument(d.data())
      );
      const totalAppointments = actualAppointmentDocs.length;

      const todayAppointments = actualAppointmentDocs.filter((d) => {
        const dt = parseAppointmentDate(d.data().date);
        return dt ? isToday(dt) : false;
      });

      const completedAppointments = actualAppointmentDocs.filter(
        (d) => d.data().status === "completed"
      );
      const totalRevenue = completedAppointments.length * doctorFee;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentChatsQuery = query(
        collection(db, "chats"),
        where("createdAt", ">=", Timestamp.fromDate(thirtyDaysAgo))
      );
      const recentChatsSnapshot = await getDocs(recentChatsQuery);
      const activePatients = new Set(
        recentChatsSnapshot.docs.map((d) => d.data().patientEmail)
      ).size;

      setStats({
        totalAppointments,
        todayAppointments: todayAppointments.length,
        totalRevenue,
        activePatients,
      });

      const recentQuery = query(
        collection(db, "appointments"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const recentSnapshot = await getDocs(recentQuery);
      const activities: RecentActivity[] = recentSnapshot.docs
        .filter((d) => !isToggleDocument(d.data()))
        .slice(0, 5)
        .map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            type: "appointment",
            patient: data.patientName || "Unknown Patient",
            time: data.createdAt?.toDate?.()?.toLocaleTimeString() || "Unknown",
            status: data.status || "pending",
          };
        });
      setRecentActivity(activities);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs
        .map((doc) => {
          const data = doc.data() as any;
          return {
            uid: doc.id,
            email: data.email || "",
            role: data.role || "patient",
          };
        })
        .filter((u) => u.email);
      setAllUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleEmailInputChange = (value: string) => {
    setEmailInput(value);
    if (value.length > 0) {
      const filtered = allUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(value.toLowerCase()) &&
          u.email.toLowerCase() !== SUPERADMIN_EMAIL.toLowerCase()
      );
      setFilteredUsers(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredUsers([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (email: string) => {
    setEmailInput(email);
    setShowSuggestions(false);
    setFilteredUsers([]);
  };

  const quickAccessCards = [
    {
      title: "Chats",
      description: "Active patient conversations",
      icon: MessageCircle,
      color: "from-teal-500 to-teal-600",
      hoverColor: "hover:from-teal-600 hover:to-teal-700",
      bgColor: "bg-teal-50 dark:bg-teal-950/20",
      href: "/admin/chat",
      count: "Available",
    },
    {
      title: "Calls",
      description: "Video consultations",
      icon: Video,
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      href: "/admin/calls",
      count: "Available",
    },
  ];

  const statsCards = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments.toString(),
      icon: Calendar,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      change: "+12%",
    },
    {
      title: "Total Appointments",
      value: stats.totalAppointments.toString(),
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      change: "+8%",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      change: "+15%",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card
              key={i}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 shadow-xl"
            >
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-full">
      {/* Welcome */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Welcome back, Doctor
          </h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Here's what's happening with your practice today.
        </p>
      </motion.div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {quickAccessCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="group"
          >
            <Link href={card.href}>
              <Card className={`${card.bgColor} border-0 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden relative`}>
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
                        {card.description}
                      </p>
                      <motion.div
                        className="flex items-center text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <span className="font-semibold text-lg">Access now</span>
                        <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </motion.div>
                    </div>
                    <motion.div
                      className={`w-20 h-20 bg-gradient-to-r ${card.color} ${card.hoverColor} rounded-2xl flex items-center justify-center ml-6 shadow-lg group-hover:shadow-xl transition-all duration-300`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <card.icon className="h-10 w-10 text-white" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
            whileHover={{ y: -3 }}
          >
            <Card className={`${stat.bgColor} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden relative`}>
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 group-hover:scale-105 transition-transform duration-300">
                      {stat.value}
                    </p>
                  </div>
                  <motion.div
                    className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <stat.icon className="h-7 w-7 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* User Role Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full mt-10"
      >
        <Card className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl border-slate-200/60 dark:border-slate-700/60">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
              User Role Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const roleEl = form.elements.namedItem("role") as HTMLSelectElement | null;

                const newRole = roleEl?.value.trim() as
                  | "patient"
                  | "receptionist"
                  | "admin"
                  | "";

                const email = emailInput.trim().toLowerCase();

                if (!email || !newRole) {
                  alert("Please provide email and select role");
                  return;
                }

                if (email === SUPERADMIN_EMAIL.toLowerCase()) {
                  alert("Error: Cannot change the role of the superadmin account!");
                  return;
                }

                try {
                  const usersRef = collection(db, "users");
                  const q = query(usersRef, where("email", "==", email));
                  const qs = await getDocs(q);

                  if (qs.empty) {
                    alert("User not found. Please check the email.");
                    return;
                  }

                  const targetDoc = qs.docs[0];

                  // Single atomic update with forceLogout
                  await updateDoc(targetDoc.ref, {
                    role: newRole,
                    forceLogout: true,
                    forceLogoutAt: serverTimestamp(),
                  });

                  alert(`Role updated to '${newRole}' for ${email}. User will be logged out.`);

                  // If the admin just changed *their own* role, log out immediately
                  if (user?.email?.toLowerCase() === email) {
                    await signOut(auth);
                    router.push("/login");
                  }

                  // Reset form
                  setEmailInput("");
                  setShowSuggestions(false);
                  setFilteredUsers([]);
                  if (roleEl) roleEl.value = "";
                } catch (err) {
                  console.error(err);
                  alert("Failed to update role. Try again.");
                }
              }}
              className="space-y-4"
            >
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-1 relative">
                  <Input
                    value={emailInput}
                    onChange={(e) => handleEmailInputChange(e.target.value)}
                    onFocus={() =>
                      emailInput.length > 0 &&
                      filteredUsers.length > 0 &&
                      setShowSuggestions(true)
                    }
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="Enter user email..."
                    className="flex-1"
                    autoComplete="off"
                  />
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                      {filteredUsers.map((u) => (
                        <div
                          key={u.uid}
                          onClick={() => handleSuggestionSelect(u.email)}
                          className="px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-slate-900 dark:text-white">{u.email}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                              {u.role}
                            </span>
                          </div>
                        </div>
                      ))}
                      {filteredUsers.length === 0 && emailInput.length > 0 && (
                        <div className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center">
                          No users found matching "{emailInput}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <select
                  name="role"
                  className="border rounded-md px-4 py-2 dark:bg-slate-700 dark:text-white dark:border-slate-600"
                >
                  <option value="">Select role</option>
                  <option value="patient">Patient</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                Update Role
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
