"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthState } from "react-firebase-hooks/auth"
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Phone, Video, Clock, User, PhoneCall, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { getDocs, where } from "firebase/firestore"

interface ActiveCall {
  id: string
  patientName: string
  patientEmail: string
  patientPhone?: string
  callType: "audio" | "video"
  status: "waiting" | "connected" | "ended"
  createdAt: any
  channelName: string
  urgency?: "low" | "medium" | "high"
  patientUid: string
}

export default function CallsPage() {
  const [user] = useAuthState(auth)
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!user) return

    // Listen to active calls
    const activeCallsQuery = query(collection(db, "activeCalls"), orderBy("createdAt", "desc"))

    const unsubscribeActiveCalls = onSnapshot(activeCallsQuery, (snapshot) => {
      const calls: ActiveCall[] = []
      snapshot.forEach((doc) => {
        calls.push({ id: doc.id, ...doc.data() } as ActiveCall)
      })
      setActiveCalls(calls)
      setLoading(false)
    })

    return () => unsubscribeActiveCalls()
  }, [user])

  const joinCall = async (call: ActiveCall) => {
    try {
      // Update call status to connected
      await updateDoc(doc(db, "activeCalls", call.id), {
        status: "connected",
        doctorJoinedAt: serverTimestamp(),
      })

      // Navigate to call interface
      router.push(`/admin/call?channel=${call.channelName}&type=${call.callType}&callId=${call.id}`)
    } catch (error) {
      console.error("Error joining call:", error)
      alert("Failed to join call. Please try again.")
    }
  }

  const endCall = async (call: ActiveCall) => {
  try {
    const logsRef = collection(db, "callLogs");
    const existingLogQuery = query(logsRef, where("callId", "==", call.id));
    const snapshot = await getDocs(existingLogQuery);

    if (snapshot.empty) {
      await addDoc(logsRef, {
        callId: call.id, // ✅ store callId for duplicate check
        patientName: call.patientName,
        patientUid: call.patientUid,
        callType: call.callType,
        duration: 0,
        startTime: call.createdAt,
        endTime: serverTimestamp(),
        status: "cancelled",
      });
    }

    // Remove from active calls
    await deleteDoc(doc(db, "activeCalls", call.id));
  } catch (error) {
    console.error("Error ending call:", error);
  }
};


  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Calls</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Active Calls</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage incoming patient calls</p>
        </div>
      </div>

      {/* Active Calls View */}
      <div className="space-y-4">
        {activeCalls.length === 0 ? (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <PhoneCall className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Active Calls</h3>
              <p className="text-slate-600 dark:text-slate-400">
                When patients initiate calls, they will appear here for you to join.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeCalls.map((call, index) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            call.callType === "video" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                          }`}
                        >
                          {call.callType === "video" ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{call.patientName}</h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{call.patientUid}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{call.createdAt?.toDate?.()?.toLocaleTimeString() || "Just now"}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {call.urgency && (
                          <Badge className={getUrgencyColor(call.urgency)}>{call.urgency.toUpperCase()}</Badge>
                        )}

                        <Badge
                          variant={call.status === "waiting" ? "secondary" : "default"}
                          className={
                            call.status === "waiting"
                              ? "bg-yellow-100 text-yellow-800 animate-pulse"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {call.status === "waiting" ? (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Waiting
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Connected
                            </>
                          )}
                        </Badge>

                        <div className="flex space-x-2">
                          <Button
                            onClick={() => joinCall(call)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            {call.callType === "video" ? (
                              <>
                                <Video className="h-4 w-4 mr-2" />
                                Join Video Call
                              </>
                            ) : (
                              <>
                                <Phone className="h-4 w-4 mr-2" />
                                Join Audio Call
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => endCall(call)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}