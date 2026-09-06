"use client";

import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Manage KPT Club activities and users.
        </p>
      </div>


      <div className="grid gap-6 md:grid-cols-3">

        <DashboardCard
          title="Users"
          description="Manage students, faculty and administrators."
          onClick={() => router.push("/admin/users")}
        />

        <DashboardCard
          title="Clubs & Activities"
          description="Manage college clubs and activities."
          onClick={() => router.push("/admin/clubs")}
        />

        <DashboardCard
          title="Reports"
          description="View club membership and attendance statistics."
          onClick={() => router.push("/admin/reports")}
        />

      </div>

    </div>
  );
}


function DashboardCard({
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-white p-6 text-left shadow transition hover:shadow-lg"
    >

      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      <p className="mt-2 text-gray-500">
        {description}
      </p>

    </button>
  );
}