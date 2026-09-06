"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import api from "@/lib/api";

export default function AddClubPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "CLUB",
    description: "",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const token = await getToken();

      await api.post(
        "/api/clubs",
        {
          name: formData.name,
          code: formData.code,
          type: formData.type,
          description: formData.description,
          isActive: formData.isActive,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push("/admin/clubs");
    } catch (error) {
      console.error(
        "Create club error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to create club"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">

      {/* HEADER */}
      <div className="mb-8">

        <button
          type="button"
          onClick={() => router.push("/admin/clubs")}
          className="mb-4 text-sm text-blue-600 hover:underline"
        >
          ← Back to Clubs
        </button>

        <h1 className="text-3xl font-bold">
          Add Club / Activity
        </h1>

        <p className="mt-2 text-gray-600">
          Add a new club or institutional activity.
        </p>

      </div>


      {/* ERROR */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}


      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl bg-white p-8 shadow"
      >

        {/* NAME */}
        <div>

          <label className="mb-2 block font-medium">
            Club / Activity Name
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            placeholder="Enter club or activity name"
          />

        </div>


        {/* CODE */}
        <div>

          <label className="mb-2 block font-medium">
            Code
          </label>

          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            className="w-full rounded-lg border p-3 uppercase outline-none focus:border-blue-500"
            placeholder="Example: TECH"
          />

        </div>


        {/* TYPE */}
        <div>

          <label className="mb-2 block font-medium">
            Type
          </label>

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
          >

            <option value="CLUB">
              Club
            </option>

            <option value="CELL">
              Cell
            </option>

            <option value="COMMITTEE">
              Committee
            </option>

            <option value="INSTITUTIONAL_ACTIVITY">
              Institutional Activity
            </option>

          </select>

        </div>


        {/* DESCRIPTION */}
        <div>

          <label className="mb-2 block font-medium">
            Description
          </label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
            placeholder="Enter description (optional)"
          />

        </div>


        {/* ACTIVE */}
        <div className="flex items-center gap-3">

          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4"
          />

          <label className="font-medium">
            Active
          </label>

        </div>


        {/* BUTTONS */}
        <div className="flex gap-4 pt-4">

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Club"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/clubs")}
            className="rounded-lg border px-6 py-3 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}