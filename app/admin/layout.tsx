"use client"
import { ThemeProvider } from 'next-themes'
import type React from "react"
import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Phone,
  DollarSign,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Stethoscope,
} from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Calendar, label: "Appointments", href: "/admin/appointments" },
  { icon: Users, label: "Patients", href: "/admin/patients" },
  { icon: MessageSquare, label: "Chat", href: "/admin/chat" },
  { icon: Phone, label: "Calls", href: "/admin/calls" },
  { icon: DollarSign, label: "Revenue", href: "/admin/revenue" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const doctorEmail = process.env.NEXT_PUBLIC_DOCTOR_EMAIL

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && (!user || user.email !== doctorEmail)) {
      router.push("/login")
    }
  }, [user, loading, router, doctorEmail])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Empty div to prevent layout shift */}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  if (!user || user.email !== doctorEmail) {
    return null
  }

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? "80px" : "280px",
          x: sidebarOpen || window.innerWidth >= 1024 ? 0 : -280,
        }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dr. Admin Panel</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Healthcare Management</p>
                </div>
              </motion.div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </Button>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="font-medium truncate">{item.label}</span>}
                  </motion.div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Doctor Info & Logout */}
        <div className="absolute bottom-6 left-6 right-6 space-y-4">
          {!sidebarCollapsed && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">DN</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Dr. Nitin Mishra</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dermatologist</p>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4 mr-3" />
            {!sidebarCollapsed && "Logout"}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div 
        className={`transition-all duration-300`} 
        style={{ marginLeft: sidebarCollapsed ? "80px" : "280px" }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
  <div className="flex items-center justify-between px-6 py-4">
    <div className="flex items-center space-x-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setSidebarOpen(true)} 
        className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </Button>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {sidebarItems.find((item) => item.href === pathname)?.label || "Dashboard"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Dr. Nitin Mishra's Practice Management</p>
      </div>
    </div>

    <div className="flex items-center space-x-4">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => {
          const newTheme = resolvedTheme === "dark" ? "light" : "dark";
          setTheme(newTheme);
        }}
        className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4 text-gray-300" />
        ) : (
          <Moon className="h-4 w-4 text-gray-700" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>
      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-medium">DN</span>
      </div>
    </div>
  </div>
</header>


        {/* Page Content */}
        <main className="p-6 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}