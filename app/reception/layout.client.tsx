"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { useTodayNotifications } from "./hooks/useTodayNotifications"
import { useTheme } from "./components/ThemeProvider"
import Sidebar from "./components/Sidebar"
import "../globals.css"

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  const { notifications, unread, markAsRead, audioRef } = useTodayNotifications()
  const [showDropdown, setShowDropdown] = useState(false)
  const { theme } = useTheme()

  // 🔹 States for Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)   // mobile drawer
  const [collapsed, setCollapsed] = useState(false)       // desktop collapse

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
    if (unread) markAsRead()
  }

  return (
    <div className={`flex min-h-screen ${theme === "dark" ? "dark" : ""}`}>
      <div className="flex w-screen">
        {/* -------- Sidebar (works for both desktop & mobile) -------- */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* -------- Main Content Area -------- */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b shadow-sm bg-white dark:bg-gray-800 relative">
            {/* Hamburger (mobile only) */}
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden mr-4 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg
                  className="w-6 h-6 text-gray-700 dark:text-gray-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white">
                Reception Dashboard
              </h1>
            </div>

            {/* Notifications */}
            <button onClick={toggleDropdown} className="relative">
              <Bell className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              {unread && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-4 top-14 z-50 w-72 bg-white dark:bg-gray-800 shadow-lg border rounded-md overflow-hidden">
                <div className="text-gray-800 dark:text-gray-100 font-semibold px-4 py-2 border-b">
                  Today's Appointments
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                    No new appointments
                  </div>
                ) : (
                  <ul className="max-h-60 overflow-y-auto">
                    {notifications.map((notif) => (
                      <li
                        key={notif.id}
                        className="px-4 py-2 border-b text-sm"
                      >
                        <div className="font-medium">{notif.name}</div>
                        <div className="text-gray-600 dark:text-gray-300">
                          {notif.phone}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(
                            notif.createdAt.seconds * 1000
                          ).toLocaleTimeString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="container mx-auto px-6 py-8 w-full">{children}</div>
          </main>
        </div>
      </div>

      {/* Hidden Audio for Notifications */}
      <audio ref={audioRef} preload="auto" src="/notification.mp3" />
    </div>
  )
}