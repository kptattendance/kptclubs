"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
export default function AdminUsersPage() {
const router = useRouter();
  const { getToken } = useAuth();

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


    const handleDelete = async (userId, userName) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${userName}?`
  );

  if (!confirmed) return;

  try {
    const token = await getToken();

    await api.delete(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Remove deleted user from the table
    setUsers((currentUsers) =>
      currentUsers.filter((user) => user._id !== userId)
    );

  } catch (error) {
    console.error(
      "Failed to delete user:",
      error.response?.data || error.message
    );

    setError(
      error.response?.data?.message ||
        "Failed to delete user"
    );
  }
};

  // =====================================================
  // LOAD USERS
  // =====================================================

  const loadUsers = async () => {

    try {

      setLoading(true);

      setError("");

      const token =
        await getToken();


      const response =
        await api.get(
          "/api/users",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      setUsers(
        response.data.users || []
      );

    } catch (error) {

      console.error(
        "Failed to fetch users:",
        error.response?.data ||
          error.message
      );


      setError(
        error.response?.data?.message ||
          "Failed to fetch users"
      );

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    if (getToken) {
      loadUsers();
    }

  }, [getToken]);


  return (

    <main className="p-8">

      <div className="mb-6 flex items-center justify-between">

        <h1 className="text-3xl font-bold">
          Users
        </h1>


       <button
  type="button"
  onClick={() => router.push("/admin/users/new")}
  className="rounded bg-blue-600 px-5 py-3 text-white"
>
  Add User
</button>

      </div>


      {loading && (
        <p>
          Loading users...
        </p>
      )}


      {error && (
        <p className="text-red-600">
          {error}
        </p>
      )}


      {!loading &&
        !error && (

          <div className="overflow-x-auto">

            <table className="w-full border">

              <thead>

                <tr className="border-b bg-gray-100">

                  <th className="p-3 text-left">
                    Photo
                  </th>

                  <th className="p-3 text-left">
                    Name
                  </th>

                  <th className="p-3 text-left">
                    Email
                  </th>

                  <th className="p-3 text-left">
                    Phone
                  </th>

                  <th className="p-3 text-left">
                    Type
                  </th>

                  <th className="p-3 text-left">
                    Role
                  </th>

                  <th className="p-3 text-left">
                    Department
                  </th>

                  <th className="p-3 text-left">
                    Club
                  </th>

                  <th className="p-3 text-left">
                    Status
                  </th>
<th className="p-3 text-left">
  Actions
</th>
                </tr>

              </thead>


              <tbody>

                {users.length === 0 ? (

                  <tr>

                    <td
                      colSpan="10"
                      className="p-6 text-center"
                    >
                      No users found
                    </td>

                  </tr>

                ) : (

                  users.map((user) => (

                    <tr
                      key={user._id}
                      className="border-b"
                    >

{/* PHOTO */}

<td className="p-3">

  {user.profilePhoto ? (

    <img
      src={user.profilePhoto}
      alt={user.name}
      className="h-12 w-12 rounded-full object-cover"
    />

  ) : (

    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500">
      N/A
    </div>

  )}

</td>

                      {/* NAME */}

                      <td className="p-3 font-medium">
                        {user.name}
                      </td>


                      {/* EMAIL */}

                      <td className="p-3">
                        {user.email}
                      </td>


                      {/* PHONE */}

                      <td className="p-3">
                        {user.phone || "-"}
                      </td>


                      {/* TYPE */}

                      <td className="p-3">
                        {user.userType}
                      </td>


                      {/* ROLE */}

                      <td className="p-3">
                        {user.role}
                      </td>


                      {/* DEPARTMENT */}

                      <td className="p-3">

                        {user.departmentId
                          ? `${user.departmentId.code} - ${user.departmentId.name}`
                          : "-"}

                      </td>


                      {/* CLUB */}

                      <td className="p-3">

                        {user.clubId
                          ? `${user.clubId.code} - ${user.clubId.name}`
                          : "-"}

                      </td>


                      {/* STATUS */}

                      <td className="p-3">

                        {user.isActive ? (

                          <span className="rounded bg-green-100 px-2 py-1 text-sm text-green-700">
                            Active
                          </span>

                        ) : (

                          <span className="rounded bg-red-100 px-2 py-1 text-sm text-red-700">
                            Inactive
                          </span>

                        )}

                      </td>

<td className="p-3">
  <button
    onClick={() => handleDelete(user._id, user.name)}
    className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
  >
    Delete
  </button>
</td>
                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        )}

    </main>

  );
}