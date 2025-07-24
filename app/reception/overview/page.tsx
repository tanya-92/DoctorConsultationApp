"use client";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  getDocs,
  where,
} from "firebase/firestore";
import { CalendarIcon, UsersIcon } from "../components/Icons";
import StatsCard from "../components/StatsCard";
import AppointmentCard from "../components/AppointmentCard";
import { useAppointmentStatus } from "../hooks/useAppointmentStatus";
import { Switch } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { deleteDoc } from "firebase/firestore";

type Appointment = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  date: string | Timestamp;
  time: string | Timestamp;
  clinic: string;
  urgency: string;
  createdAt: Timestamp;
  status: string;
  symptoms: string;
};

export default function ReceptionOverview() {
  const { active, toggleStatus } = useAppointmentStatus();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sortDesc, setSortDesc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today"); // today, lastMonth, all
  const [searchQuery, setSearchQuery] = useState("");
  const todayDate = new Date();
  const [applySearch, setApplySearch] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Helper to check Firestore Timestamp
  const isFirestoreTimestamp = (value: any): boolean => {
    return (
      value &&
      typeof value === "object" &&
      "seconds" in value &&
      "nanoseconds" in value
    );
  };

  // Convert date/timestamp safely
  const getSafeDate = (value: string | Timestamp): Date => {
    if (typeof value === "string") {
      // If it's a string like "2025-07-24", parse it safely
      return new Date(value + "T00:00:00");
    } else if (value && "seconds" in value) {
      return new Date(value.seconds * 1000);
    } else {
      return new Date();
    }
  };

  const formatDate = (value: string | Timestamp): string => {
    return getSafeDate(value).toLocaleDateString();
  };

  const formatTime = (value: string | Timestamp): string => {
    return getSafeDate(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  // Fetch appointments from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "appointments"),
      orderBy("createdAt", sortDesc ? "desc" : "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      setAppointments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortDesc]);

  // Filter logic

  const filteredAppointments = appointments
    // 1. Apply Date Filter
    .filter((apt) => {
      const date = getSafeDate(apt.date);
      if (filter === "today") {
        return date.toDateString() === todayDate.toDateString();
      } else if (filter === "lastMonth") {
        return (
          date.getMonth() === todayDate.getMonth() - 1 &&
          date.getFullYear() === todayDate.getFullYear()
        );
      } else {
        return true; // All
      }
    })

    // 2. Apply Search Filter (name/phone)
    .filter((apt) => {
      const name = `${apt.firstName ?? ""} ${apt.lastName ?? ""}`.toLowerCase();
      const phone = apt.phone ?? "";
      return name.includes(applySearch) || phone.includes(applySearch);
    })

    // 3. Sort by createdAt or date
    .sort((a, b) => {
      const dateA = getSafeDate(a.createdAt ?? a.date);
      const dateB = getSafeDate(b.createdAt ?? b.date);
      return sortDesc
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

  // State for delete confirmation
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const handleDeleteConfirmed = async () => {
    try {
      const now = new Date();
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthYear =
        now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      const snapshot = await getDocs(collection(db, "appointments"));
      const toDelete = snapshot.docs.filter((doc) => {
        const data = doc.data();
        const dateObj = getSafeDate(data.date);
        return (
          dateObj.getMonth() === lastMonth &&
          dateObj.getFullYear() === lastMonthYear
        );
      });

      const deletions = toDelete.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletions);

      setDeleteSuccess(true);
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reception Dashboard
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {todayDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
      {/* Search Bar */}
      <div className="flex items-center gap-2 mt-4">
        <input
          type="text"
          placeholder="Search appointments, patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setApplySearch(searchQuery.toLowerCase());
            }
          }}
          className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
        />
        <Button
          size="sm"
          onClick={() => setApplySearch(searchQuery.toLowerCase())}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Search className="w-4 h-4 mr-2" />
        </Button>
      </div>

      {/* Toggle New Appointments */}
      <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            Allow New Appointments
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Toggle to stop patients from booking appointments for today.
          </p>
        </div>
        <Switch
          checked={active}
          onChange={toggleStatus}
          className={`${
            active ? "bg-green-500" : "bg-red-500"
          } relative inline-flex h-6 w-11 items-center rounded-full transition`}
        >
          <span
            className={`${
              active ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
          />
        </Switch>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard
          title="Total Appointments (Filtered)"
          value={filteredAppointments.length}
          icon={CalendarIcon}
          color="blue"
        />
        <StatsCard
          title="Total Appointments Overall"
          value={appointments.length}
          icon={UsersIcon}
          color="purple"
        />
      </div>

      {/* Sort + Filter */}

      <div className="flex justify-end items-center mt-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="ml-2 p-2 rounded border dark:bg-gray-800 dark:text-white"
        >
          <option value="today">Today</option>
          <option value="lastMonth">Last Month</option>
          <option value="all">All</option>
        </select>
        <Button className="ml-2" onClick={() => setSortDesc((prev) => !prev)}>
          Sort: {sortDesc ? "Newest First" : "Oldest First"}
        </Button>
        <Button
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white ml-2"
          onClick={() => setShowConfirmModal(true)}
        >
          Delete Last Month’s Appointments
        </Button>

        {showConfirmModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-md max-w-sm w-full">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Confirm Deletion
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you sure you want to delete last month’s appointments? This
                action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {deleteSuccess && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
            Last month’s appointments deleted successfully!
            <button
              className="ml-3 font-bold"
              onClick={() => setDeleteSuccess(false)}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Appointment List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto mt-4">
        {loading ? (
          <div className="text-gray-500 dark:text-gray-400">
            Loading appointments...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">
            No appointments found.
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={{
                id: appointment.id,
                patientName: `${appointment.firstName ?? "?"} ${
                  appointment.lastName ?? "?"
                }`,
                patientPhone: appointment.phone ?? "N/A",
                appointmentDate: formatDate(appointment.date),
                appointmentTime:
                  typeof appointment.time === "string"
                    ? appointment.time
                    : formatTime(appointment.time),
                clinic: appointment.clinic ?? "N/A",
                urgency: appointment.urgency ?? "low",
                status: appointment.status ?? "pending",
                symptoms:
                  appointment.symptoms && appointment.symptoms.trim() !== ""
                    ? appointment.symptoms
                    : "N/A",
              }}
              onDelete={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
