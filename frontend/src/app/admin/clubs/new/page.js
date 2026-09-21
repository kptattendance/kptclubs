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

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =====================================================
  // CREATE CLUB
  // =====================================================

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
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-4xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6">

          <button
            type="button"
            onClick={() =>
              router.push("/admin/clubs")
            }
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-blue-600"
          >
            <span className="text-lg">
              ←
            </span>

            Back to Clubs
          </button>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-sm">
                🏛️
              </div>

              <div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Add Club / Activity
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new college club or institutional activity.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 font-bold text-red-600">
                !
              </div>

              <div>

                <p className="font-semibold text-red-800">
                  Unable to create club
                </p>

                <p className="mt-0.5 text-sm text-red-700">
                  {error}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* ================================================= */}
          {/* BASIC INFORMATION */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              icon="🏛️"
              title="Basic Information"
              description="Enter the main details of the club or activity"
              color="blue"
            />

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-2">

              {/* NAME */}

              <FormField
                label="Club / Activity Name"
                required
              >

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter club or activity name"
                />

              </FormField>

              {/* CODE */}

              <FormField
                label="Club Code"
                required
              >

                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  className="form-input uppercase"
                  placeholder="Example: TECH"
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Use a short unique code for the club.
                </p>

              </FormField>

              {/* TYPE */}

              <FormField
                label="Type"
                required
              >

                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-input"
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

              </FormField>

            </div>

          </section>

        

          {/* ================================================= */}
          {/* STATUS */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              icon="⚙️"
              title="Club Status"
              description="Control whether this club is currently available"
              color="emerald"
            />

            <div className="p-5 sm:p-7">

              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40 sm:p-5">

                <div className="flex items-center gap-4">

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      formData.isActive
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {formData.isActive
                      ? "✓"
                      : "○"}
                  </div>

                  <div>

                    <p className="font-semibold text-slate-800">
                      {formData.isActive
                        ? "Club is Active"
                        : "Club is Inactive"}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {formData.isActive
                        ? "The club will be available for normal use."
                        : "The club will be marked as inactive."}
                    </p>

                  </div>

                </div>

                {/* SWITCH */}

                <div className="relative shrink-0">

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="peer sr-only"
                  />

                  <div className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 peer-focus:ring-4 peer-focus:ring-emerald-100" />

                  <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />

                </div>

              </label>

            </div>

          </section>

          

          {/* ================================================= */}
          {/* ACTIONS */}
          {/* ================================================= */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="font-semibold text-slate-800">
                  Ready to create this club?
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  The club will be added to the college system.
                </p>

              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin/clubs")
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="text-lg leading-none">
                        ✓
                      </span>

                      Create Club
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </form>

      </div>

      {/* ================================================= */}
      {/* FORM STYLES */}
      {/* ================================================= */}

      <style jsx global>{`

        .form-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: rgb(248 250 252);
          padding: 0.75rem 0.875rem;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
          transition:
            border-color 150ms ease,
            background-color 150ms ease,
            box-shadow 150ms ease;
        }

        .form-input::placeholder {
          color: rgb(148 163 184);
        }

        .form-input:hover {
          border-color: rgb(203 213 225);
          background: white;
        }

        .form-input:focus {
          border-color: rgb(59 130 246);
          background: white;
          box-shadow:
            0 0 0 4px rgb(219 234 254);
        }

        select.form-input {
          cursor: pointer;
        }

      `}</style>

    </main>
  );
}

// =====================================================
// SECTION HEADER
// =====================================================

function SectionHeader({
  icon,
  title,
  description,
  color = "blue",
}) {
  const colors = {
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-100",
      text: "text-blue-700",
    },

    indigo: {
      bg: "bg-indigo-50",
      icon: "bg-indigo-100",
      text: "text-indigo-700",
    },

    emerald: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100",
      text: "text-emerald-700",
    },
  };

  const theme =
    colors[color] || colors.blue;

  return (
    <div
      className={`flex items-center gap-3 border-b border-slate-100 ${theme.bg} px-5 py-4 sm:px-7`}
    >

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.icon}`}
      >
        {icon}
      </div>

      <div>

        <h2
          className={`text-sm font-bold ${theme.text}`}
        >
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// FORM FIELD
// =====================================================

function FormField({
  label,
  required = false,
  optional = false,
  children,
}) {
  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <label className="text-sm font-semibold text-slate-700">

          {label}

          {required && (
            <span className="ml-1 text-red-500">
              *
            </span>
          )}

        </label>

        {optional && (
          <span className="text-xs text-slate-400">
            Optional
          </span>
        )}

      </div>

      {children}

    </div>
  );
}