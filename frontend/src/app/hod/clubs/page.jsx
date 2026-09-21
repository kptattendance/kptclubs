"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
          response.data.message || "Failed to load clubs"
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
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-5 sm:py-5">

      <div className="mx-auto w-full max-w-7xl">

        {/* HEADER */}
        <div className="mb-4 sm:mb-5">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Clubs
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Clubs and students from your department
          </p>
        </div>


        {/* ERROR */}
        {error && (
          <div
            className="
              mb-4
              rounded-lg
              border border-red-200
              bg-red-50
              px-3 py-3
              text-xs text-red-600
              sm:px-4 sm:text-sm
            "
          >
            {error}
          </div>
        )}


        {/* LOADING */}
        {loading ? (
          <div
            className="
              rounded-lg
              border border-gray-200
              bg-white
              p-6
              text-center
              text-sm text-gray-500
            "
          >
            Loading clubs...
          </div>
        ) : clubs.length === 0 ? (

          /* EMPTY */
          <div
            className="
              rounded-lg
              border border-gray-200
              bg-white
              p-6
              text-center
              text-sm text-gray-500
            "
          >
            No clubs found.
          </div>

        ) : (

          /* TABLE */
          <div
            className="
              overflow-hidden
              rounded-lg
              border border-gray-200
              bg-white
              shadow-sm
            "
          >

            {/* TABLE SCROLL CONTAINER */}
            <div
              className="
                w-full
                overflow-x-auto
                overscroll-x-contain
              "
            >

              <table
                className="
                  w-full
                  min-w-[620px]
                  text-xs
                  sm:min-w-[700px]
                  sm:text-sm
                "
              >

                {/* HEADER */}
                <thead className="bg-gray-100">

                  <tr className="border-b border-gray-200">

                    <th
                      className="
                        w-12
                        px-3 py-3
                        text-left
                        font-semibold
                        text-gray-700
                        sm:w-14
                        sm:px-4
                      "
                    >
                      #
                    </th>

                    <th
                      className="
                        px-3 py-3
                        text-left
                        font-semibold
                        text-gray-700
                        sm:px-4
                      "
                    >
                      Club Name
                    </th>

                    <th
                      className="
                        px-3 py-3
                        text-left
                        font-semibold
                        text-gray-700
                        sm:px-4
                      "
                    >
                      Code
                    </th>

                    <th
                      className="
                        px-3 py-3
                        text-left
                        font-semibold
                        text-gray-700
                        sm:px-4
                      "
                    >
                      Type
                    </th>

                    <th
                      className="
                        px-3 py-3
                        text-center
                        font-semibold
                        text-gray-700
                        sm:px-4
                      "
                    >
                      Students
                    </th>

                    <th
                      className="
                        w-32
                        px-3 py-3
                        text-center
                        font-semibold
                        text-gray-700
                        sm:w-36
                        sm:px-4
                      "
                    >
                      Action
                    </th>

                  </tr>

                </thead>


                {/* BODY */}
                <tbody className="divide-y divide-gray-100">

                  {clubs.map((club, index) => (

                    <tr
                      key={club.id || club._id}
                      className="
                        transition
                        hover:bg-blue-50/40
                      "
                    >

                      {/* NUMBER */}
                      <td
                        className="
                          px-3 py-3
                          text-gray-500
                          sm:px-4
                        "
                      >
                        {index + 1}
                      </td>


                      {/* CLUB NAME */}
                      <td
                        className="
                          max-w-[180px]
                          px-3 py-3
                          sm:max-w-[260px]
                          sm:px-4
                        "
                      >
                        <span
                          className="
                            block
                            break-words
                            font-medium
                            text-gray-800
                          "
                        >
                          {club.name}
                        </span>
                      </td>


                      {/* CODE */}
                      <td
                        className="
                          whitespace-nowrap
                          px-3 py-3
                          text-gray-600
                          sm:px-4
                        "
                      >
                        {club.code || "-"}
                      </td>


                      {/* TYPE */}
                      <td
                        className="
                          max-w-[150px]
                          px-3 py-3
                          text-gray-600
                          sm:max-w-[200px]
                          sm:px-4
                        "
                      >
                        <span className="block break-words">
                          {club.type || "-"}
                        </span>
                      </td>


                      {/* STUDENTS */}
                      <td
                        className="
                          whitespace-nowrap
                          px-3 py-3
                          text-center
                          sm:px-4
                        "
                      >
                        <span className="font-semibold text-blue-600">
                          {club.studentCount ?? 0}
                        </span>
                      </td>


                      {/* ACTION */}
                      <td
                        className="
                          whitespace-nowrap
                          px-3 py-3
                          text-center
                          sm:px-4
                        "
                      >

                        <button
                          onClick={() =>
                            router.push(
                              `/hod/attendance?clubId=${
                                club.id || club._id
                              }`
                            )
                          }
                          className="
                            inline-flex
                            min-h-[34px]
                            items-center
                            justify-center
                            rounded-md
                            bg-blue-600
                            px-3 py-1.5
                            text-xs
                            font-medium
                            text-white
                            transition
                            hover:bg-blue-700
                            active:bg-blue-800
                            sm:px-3.5
                          "
                        >
                          Attendance
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}