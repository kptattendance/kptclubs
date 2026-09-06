"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export default function HODClubsPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClubs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await axios.get(
        `${API_URL}/api/hod/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Failed to load clubs"
        );
      }

      setClubs(response.data.clubs || []);
    } catch (err) {
      console.error("Load HOD clubs error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load clubs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  return (
    <div className="p-4">

      {/* HEADER */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Clubs
        </h1>

        <p className="text-sm text-gray-500">
          Clubs and students from your department
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="rounded border bg-white p-5 text-center text-sm text-gray-500">
          Loading clubs...
        </div>
      ) : clubs.length === 0 ? (
        <div className="rounded border bg-white p-5 text-center text-sm text-gray-500">
          No clubs found.
        </div>
      ) : (

        /* TABLE */
        <div className="overflow-x-auto rounded border bg-white">

          <table className="w-full text-sm">

            <thead className="border-b bg-gray-50">

              <tr>

                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  #
                </th>

                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Club Name
                </th>

                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Code
                </th>

                <th className="px-3 py-2 text-left font-semibold text-gray-700">
                  Type
                </th>

                <th className="px-3 py-2 text-center font-semibold text-gray-700">
                  Students
                </th>

                <th className="px-3 py-2 text-center font-semibold text-gray-700">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y">

              {clubs.map((club, index) => (

                <tr
                  key={club.id || club._id}
                  className="hover:bg-gray-50"
                >

                  <td className="px-3 py-2 text-gray-500">
                    {index + 1}
                  </td>

                  <td className="px-3 py-2 font-medium text-gray-800">
                    {club.name}
                  </td>

                  <td className="px-3 py-2 text-gray-600">
                    {club.code || "-"}
                  </td>

                  <td className="px-3 py-2 text-gray-600">
                    {club.type || "-"}
                  </td>

                  <td className="px-3 py-2 text-center font-semibold text-blue-600">
                    {club.studentCount ?? 0}
                  </td>

                  <td className="px-3 py-2 text-center">

                    <button
                      onClick={() =>
                        router.push(
                          `/hod/attendance?clubId=${
                            club.id || club._id
                          }`
                        )
                      }
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Attendance
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}