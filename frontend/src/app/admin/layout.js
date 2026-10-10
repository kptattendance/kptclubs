"use client";

import RoleProtected from "../components/RoleProtected";
import AdminShell from "../components/AdminShell";

export default function AdminLayout({ children }) {
  return (
    <RoleProtected allowedRoles={["ADMIN"]}>
      <AdminShell>{children}</AdminShell>
    </RoleProtected>
  );
}
