"use client";

import { useParams } from "next/navigation";

export default function ClubActivitiesPage() {
  const { clubCode } = useParams();

  return (
    <div>

      <h1 className="text-3xl font-bold">
        Activities
      </h1>

      <p className="mt-2 text-gray-600">
        {clubCode?.toUpperCase()} Club
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow">

        <p className="text-gray-500">
          Club activities will appear here.
        </p>

      </div>

    </div>
  );
}