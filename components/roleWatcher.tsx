// components/RoleWatcher.tsx
"use client";

import { useUserRole } from "@/hooks/useUserRole";

export default function RoleWatcher() {
  // Mounts the realtime listener globally
  useUserRole();
  return null; // nothing to render
}
