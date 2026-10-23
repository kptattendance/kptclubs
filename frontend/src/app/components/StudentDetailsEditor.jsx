"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

import api from "@/lib/api";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500";

const fromStudent = (student) => ({
  name: student?.name || "",
  phone: student?.phone || "",
  registerNumber: student?.registerNumber || "",
  departmentId: student?.department?._id || "",
  semester: student?.semester ? String(student.semester) : "",
  admissionYear: student?.admissionYear
    ? String(student.admissionYear)
    : "",
});

export default function StudentDetailsEditor({
  student,
  onUpdated,
}) {
  const { getToken } = useAuth();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => fromStudent(student));
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const openEditor = async () => {
    setForm(fromStudent(student));
    setError("");
    setSuccess("");
    setOpen(true);

    // Department list is only needed when the form is opened
    if (departments.length === 0) {
      try {
        const response = await api.get("/api/departments");

        setDepartments(response.data.departments || []);
      } catch {
        setError("Could not load departments. Please try again.");
      }
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const token = await getToken();

      const response = await api.put(
        "/api/student/profile",
        {
          ...form,
          semester: Number(form.semester),
          admissionYear: Number(form.admissionYear),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onUpdated?.(response.data.student);

      setSuccess(response.data.message || "Details updated");
      setOpen(false);
    } catch (saveError) {
      setError(
        saveError.response?.data?.message ||
          "Failed to update your details"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            My details
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {success ||
              "Name, phone, register number, department and semester."}
          </p>
        </div>

        <button
          type="button"
          onClick={openEditor}
          className="w-full shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          Edit Details
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <p className="mb-4 text-sm font-semibold text-slate-800">
        Edit my details
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Full name
          </span>
          <input
            name="name"
            value={form.name}
            onChange={updateField}
            required
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Phone number
          </span>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={updateField}
            required
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Register number
          </span>
          <input
            name="registerNumber"
            value={form.registerNumber}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                registerNumber: event.target.value.toUpperCase(),
              }))
            }
            required
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Department
          </span>
          <select
            name="departmentId"
            value={form.departmentId}
            onChange={updateField}
            required
            className={inputClass}
          >
            <option value="">Select department</option>

            {departments.map((department) => (
              <option
                key={department._id}
                value={department._id}
              >
                {department.code} - {department.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Semester
          </span>
          <select
            name="semester"
            value={form.semester}
            onChange={updateField}
            required
            className={inputClass}
          >
            <option value="">Select semester</option>

            {[1, 2, 3, 4, 5, 6].map((semester) => (
              <option key={semester} value={semester}>
                Semester {semester}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Admission year
          </span>
          <input
            name="admissionYear"
            type="number"
            min="2000"
            max={new Date().getFullYear() + 1}
            value={form.admissionYear}
            onChange={updateField}
            required
            className={inputClass}
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Email: {student?.email} (cannot be changed)
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={saving}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
