"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminClubsPage() {
  const { getToken } = useAuth();
const router = useRouter();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const loadClubs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const response = await api.get("/api/clubs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setClubs(response.data.clubs || []);
    } catch (error) {
      console.error(
        "Failed to fetch clubs:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to fetch clubs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken) {
      loadClubs();
    }
  }, [getToken]);

  const handleDelete = async (clubId, clubName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${clubName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(clubId);
      setError("");

      const token = await getToken();

      await api.delete(`/api/clubs/${clubId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setClubs((previousClubs) =>
        previousClubs.filter(
          (club) => club._id !== clubId
        )
      );
    } catch (error) {
      console.error(
        "Delete club error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete club"
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Clubs & Activities
        </h1>

        <p className="mt-6">
          Loading clubs...
        </p>
      </div>
    );
  }

  return (
    <div>

      {/* HEADER */}
      <div className="mb-8 flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Clubs & Activities
          </h1>

          <p className="mt-2 text-gray-600">
            Manage college clubs and institutional activities.
          </p>
        </div>

     <button
  onClick={() => router.push("/admin/clubs/new")}
  className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
>
  Add Club
</button>

      </div>


      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}


      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl bg-white shadow">

        <table className="w-full">

          <thead>
            <tr className="border-b bg-gray-50">

              <th className="p-4 text-left">
                #
              </th>

              <th className="p-4 text-left">
                Code
              </th>

              <th className="p-4 text-left">
                Name
              </th>

              <th className="p-4 text-left">
                Type
              </th>

              <th className="p-4 text-left">
                Description
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Actions
              </th>

            </tr>
          </thead>


          <tbody>

            {clubs.length === 0 ? (

              <tr>
                <td
                  colSpan="7"
                  className="p-8 text-center text-gray-500"
                >
                  No clubs found.
                </td>
              </tr>

            ) : (

              clubs.map((club, index) => (

                <tr
                  key={club._id}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="p-4">
                    {index + 1}
                  </td>

                  <td className="p-4 font-medium">
                    {club.code}
                  </td>

                  <td className="p-4">
                    {club.name}
                  </td>

                  <td className="p-4">
                    {club.type}
                  </td>

                  <td className="p-4">
                    {club.description || "-"}
                  </td>

                  <td className="p-4">

                    {club.isActive ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                        Inactive
                      </span>
                    )}

                  </td>

                  <td className="p-4">

                    <button
                      onClick={() =>
                        handleDelete(
                          club._id,
                          club.name
                        )
                      }
                      disabled={
                        deletingId === club._id
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === club._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}