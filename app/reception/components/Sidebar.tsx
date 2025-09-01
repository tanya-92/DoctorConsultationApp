"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3Icon,
  CreditCardIcon,
  SettingsIcon,
  StethoscopeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./Icons"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

const navigation = [
  { name: "Overview", href: "/reception/overview", icon: BarChart3Icon },
  { name: "Payments", href: "/reception/payments", icon: CreditCardIcon },
  { name: "Profile Settings", href: "/reception/profile", icon: SettingsIcon },
]

export default function Sidebar({
  collapsed,
  setCollapsed,
  open,
  setOpen,
}: {
  collapsed: boolean
  setCollapsed: (val: boolean) => void
  open: boolean
  setOpen: (val: boolean) => void
}) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [receptionName, setReceptionName] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setReceptionName(data.fullName || "")
        } else {
          setReceptionName("")
        }
      }
    }
    fetchUser()
  }, [user])

  return (
    <div
      className={`fixed md:static inset-y-0 left-0 transform 
      ${open ? "translate-x-0" : "-translate-x-full"} 
      md:translate-x-0 transition-transform duration-300 ease-in-out z-50
      ${collapsed ? "w-16" : "w-64"}
      bg-white dark:bg-gray-800 shadow-lg flex flex-col h-full`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Avatar className="h-10 w-10 ring-2 ring-teal-200 dark:ring-teal-700">
              <AvatarFallback className="bg-gradient-to-r from-teal-600 to-blue-600 text-white font-semibold">
                {(receptionName
                  ? receptionName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                  : "RC").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {receptionName || "Reception User"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receptionist</p>
            </div>

          </div>
        )}

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
        </button>

        {/* Close button (mobile only) */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden p-1 rounded-md text-gray-600 dark:text-gray-300"
        >
          ←
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              onClick={() => setOpen(false)} // close sidebar on mobile
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
