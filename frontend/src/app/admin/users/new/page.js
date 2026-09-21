"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

export default function AddUserPage() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";

  const [departments, setDepartments] = useState([]);
  const [clubs, setClubs] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "STUDENT",
    role: "STUDENT",
    departmentId: "",
    clubId: "",
  });

  // Selected image file
  const [photo, setPhoto] = useState(null);

  // Image preview
  const [photoPreview, setPhotoPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD DEPARTMENTS AND CLUBS
  // =====================================================

  useEffect(() => {
    if (!isLoaded) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = await getToken();

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [
          departmentResponse,
          clubResponse,
        ] = await Promise.all([
          axios.get(
            `${API_URL}/api/departments`,
            config
          ),

          axios.get(
            `${API_URL}/api/clubs/active`,
            config
          ),
        ]);

        setDepartments(
          departmentResponse.data.departments || []
        );

        setClubs(
          clubResponse.data.clubs || []
        );
      } catch (error) {
        console.error(
          "Failed to load data:",
          error.response?.data || error.message
        );

        setError(
          error.response?.data?.message ||
            "Failed to load departments and clubs"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoaded, getToken, API_URL]);

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // If role does not require club
    if (
      name === "role" &&
      value !== "CLUB_INCHARGE" &&
      value !== "CLUB_OFFICER"
    ) {
      setFormData((previous) => ({
        ...previous,
        role: value,
        clubId: "",
      }));
    }
  };

  // =====================================================
  // SELECT PHOTO
  // =====================================================

  const handlePhotoChange = (e) => {
    const selectedFile = e.target.files?.[0];

    console.log(
      "========== PHOTO SELECT =========="
    );

    console.log(
      "Selected file:",
      selectedFile
    );

    if (!selectedFile) {
      setPhoto(null);
      setPhotoPreview("");
      return;
    }

    // Check image type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file");
      setPhoto(null);
      setPhotoPreview("");
      return;
    }

    // Check size
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Photo must be less than 5 MB");
      setPhoto(null);
      setPhotoPreview("");
      return;
    }

    // Store actual File object
    setPhoto(selectedFile);

    // Create preview
    const previewUrl =
      URL.createObjectURL(selectedFile);

    setPhotoPreview(previewUrl);

    setError("");

    console.log(
      "PHOTO STORED:",
      selectedFile
    );
  };

  // =====================================================
  // UPLOAD PHOTO
  // FRONTEND → BACKEND → CLOUDINARY
  // =====================================================

  const uploadPhoto = async (photoFile) => {
    try {
      console.log(
        "========== UPLOAD PHOTO =========="
      );

      console.log(
        "Photo received:",
        photoFile
      );

      if (!photoFile) {
        throw new Error(
          "No photo selected"
        );
      }

      const uploadData = new FormData();

      // MUST MATCH:
      // backend -> upload.single("image")
      uploadData.append(
        "image",
        photoFile
      );

      console.log(
        "FormData image:",
        uploadData.get("image")
      );

      const token = await getToken();

      const response = await axios.post(
        `${API_URL}/api/uploads/profile-photo`,
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "========== UPLOAD RESPONSE =========="
      );

      console.log(
        "Response:",
        response.data
      );

      // Backend returns:
      // { success: true, photoUrl: "https://..." }

      if (
        !response.data?.success ||
        !response.data?.photoUrl
      ) {
        throw new Error(
          "Cloudinary did not return photo URL"
        );
      }

      console.log(
        "PHOTO URL RECEIVED:",
        response.data.photoUrl
      );

      return response.data.photoUrl;
    } catch (error) {
      console.error(
        "Photo upload error:",
        error.response?.data ||
          error.message
      );

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload photo"
      );
    }
  };

  // =====================================================
  // CREATE USER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(
      "========== CREATE USER =========="
    );

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const token = await getToken();

      // ============================================
      // STEP 1: UPLOAD PHOTO
      // ============================================

      let profilePhoto = "";

      if (photo) {
        console.log(
          "PHOTO EXISTS - STARTING UPLOAD"
        );

        profilePhoto =
          await uploadPhoto(photo);

        console.log(
          "FINAL PROFILE PHOTO URL:",
          profilePhoto
        );
      } else {
        console.log(
          "NO PHOTO SELECTED"
        );
      }

      // ============================================
      // STEP 2: CREATE USER DATA
      // ============================================

      const userData = {
        name:
          formData.name.trim(),

        email:
          formData.email
            .trim()
            .toLowerCase(),

        phone:
          formData.phone.trim(),

        userType:
          formData.userType,

        role:
          formData.role,

        departmentId:
          formData.departmentId || null,

        clubId:
          formData.clubId || null,

        // ONLY ONE PHOTO FIELD
        profilePhoto:
          profilePhoto,
      };

      console.log(
        "========== USER DATA =========="
      );

      console.log(
        userData
      );

      // ============================================
      // STEP 3: CREATE USER
      // ============================================

      const response =
        await axios.post(
          `${API_URL}/api/users`,
          userData,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );

      console.log(
        "========== USER CREATED =========="
      );

      console.log(
        response.data
      );

      setSuccess(
        response.data.message ||
          "User created successfully"
      );

      // ============================================
      // RESET FORM
      // ============================================

      setFormData({
        name: "",
        email: "",
        phone: "",
        userType: "STUDENT",
        role: "STUDENT",
        departmentId: "",
        clubId: "",
      });

      setPhoto(null);
      setPhotoPreview("");

      // ============================================
      // REDIRECT
      // ============================================

      setTimeout(() => {
        router.push("/admin/users");
      }, 1000);
    } catch (error) {
      console.error(
        "Create user error:",
        error.response?.data ||
          error.message
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create user"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="text-sm font-medium text-slate-600">
                Loading user form...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please wait
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-5xl">

        {/* ================================================= */}
        {/* PAGE HEADER */}
        {/* ================================================= */}

        <div className="mb-6">

          <button
            type="button"
            onClick={() =>
              router.push("/admin/users")
            }
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-blue-600"
          >
            <span className="text-lg">
              ←
            </span>

            Back to Users
          </button>

          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-2xl text-white shadow-sm">
                👤
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Add New User
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create a student, faculty, staff or administrator account.
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                !
              </div>

              <div>
                <p className="font-semibold text-red-800">
                  Unable to continue
                </p>

                <p className="mt-0.5 text-sm text-red-700">
                  {error}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* SUCCESS */}
        {/* ================================================= */}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                ✓
              </div>

              <div>
                <p className="font-semibold text-emerald-800">
                  User created successfully
                </p>

                <p className="mt-0.5 text-sm text-emerald-700">
                  Redirecting to the users list...
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
          {/* PROFILE PHOTO */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              icon="📷"
              title="Profile Photo"
              description="Upload a clear profile photograph"
              color="blue"
            />

            <div className="p-5 sm:p-7">

              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                {/* PREVIEW */}

                <div className="flex justify-center sm:block">

                  {photoPreview ? (
                    <div className="relative">

                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="h-32 w-32 rounded-2xl object-cover shadow-md ring-4 ring-slate-100"
                      />

                      <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-sm text-white shadow">
                        ✓
                      </div>

                    </div>
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">

                      <div className="text-center">
                        <div className="text-3xl">
                          👤
                        </div>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                          No Photo
                        </p>
                      </div>

                    </div>
                  )}

                </div>

                {/* UPLOAD AREA */}

                <div className="flex-1">

                  <label
                    htmlFor="profile-photo"
                    className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/50"
                  >

                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm transition group-hover:scale-105">
                      ⬆
                    </div>

                    <p className="text-sm font-semibold text-slate-700">
                      {photo
                        ? "Change profile photo"
                        : "Choose a profile photo"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      JPG, PNG or other image format
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Maximum file size: 5 MB
                    </p>

                    <input
                      id="profile-photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />

                  </label>

                </div>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* PERSONAL INFORMATION */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              icon="🧑"
              title="Personal Information"
              description="Basic details of the user"
              color="indigo"
            />

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-2">

              {/* NAME */}

              <FormField
                label="Full Name"
                required
              >
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter full name"
                />
              </FormField>

              {/* EMAIL */}

              <FormField
                label="Email Address"
                required
              >
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter email address"
                />
              </FormField>

              {/* PHONE */}

              <FormField
                label="Phone Number"
                optional
              >
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter phone number"
                />
              </FormField>

            </div>

          </section>

          {/* ================================================= */}
          {/* ACCOUNT & ACCESS */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              icon="🔐"
              title="Account & Access"
              description="Define the user's account type and system role"
              color="purple"
            />

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-2">

              {/* USER TYPE */}

              <FormField
                label="User Type"
                required
              >

                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="STUDENT">
                    Student
                  </option>

                  <option value="FACULTY">
                    Faculty
                  </option>

                  <option value="STAFF">
                    Staff
                  </option>
                </select>

              </FormField>

              {/* ROLE */}

              <FormField
                label="System Role"
                required
              >

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="STUDENT">
                    Student
                  </option>

                  <option value="CLUB_INCHARGE">
                    Club In-Charge
                  </option>

                  <option value="HOD">
                    HOD
                  </option>

                  <option value="PRINCIPAL">
                    Principal
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>
                </select>

              </FormField>

            </div>

          </section>

          {/* ================================================= */}
          {/* ORGANISATION */}
          {/* ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              icon="🏢"
              title="Department & Club"
              description="Assign the user to the appropriate department and club"
              color="emerald"
            />

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-7 md:grid-cols-2">

              {/* DEPARTMENT */}

              <FormField
                label="Department"
                optional
              >

                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.code} -{" "}
                        {department.name}
                      </option>
                    )
                  )}

                </select>

              </FormField>

              {/* CLUB */}

              <FormField
                label="Club / Activity"
                optional
              >

                <select
                  name="clubId"
                  value={formData.clubId}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">
                    Select Club / Activity
                  </option>

                  {clubs.map(
                    (club) => (
                      <option
                        key={club._id}
                        value={club._id}
                      >
                        {club.code} -{" "}
                        {club.name}
                      </option>
                    )
                  )}

                </select>

              </FormField>

            </div>

          </section>

          {/* ================================================= */}
          {/* SUBMIT AREA */}
          {/* ================================================= */}

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="font-semibold text-slate-800">
                  Ready to create this user?
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Review the information before submitting.
                </p>

              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={() =>
                    router.push("/admin/users")
                  }
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
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

                      Create User
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

    purple: {
      bg: "bg-purple-50",
      icon: "bg-purple-100",
      text: "text-purple-700",
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