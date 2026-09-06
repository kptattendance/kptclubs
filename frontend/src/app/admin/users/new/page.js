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
      <main className="p-8">
        <p>Loading...</p>
      </main>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="max-w-4xl p-8">

      {/* HEADER */}

      <div className="mb-8 flex items-center gap-4">

        <button
          type="button"
          onClick={() =>
            router.push("/admin/users")
          }
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Users
        </button>

        <h1 className="text-3xl font-bold">
          Add User
        </h1>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 rounded bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="mb-6 rounded bg-green-100 p-4 text-green-700">
          {success}
        </div>
      )}

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        {/* PHOTO */}

        <div>

          <label className="mb-2 block font-medium">
            Profile Photo
          </label>

          <div className="flex items-center gap-6">

            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-500">
                No Photo
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />

          </div>

          <p className="mt-2 text-sm text-gray-500">
            Optional. Maximum 5 MB.
          </p>

        </div>

        {/* NAME */}

        <div>
          <label className="mb-2 block font-medium">
            Full Name *
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded border p-3"
            placeholder="Enter full name"
          />
        </div>

        {/* EMAIL */}

        <div>
          <label className="mb-2 block font-medium">
            Email Address *
          </label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded border p-3"
            placeholder="Enter email address"
          />
        </div>

        {/* PHONE */}

        <div>
          <label className="mb-2 block font-medium">
            Phone Number
          </label>

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded border p-3"
            placeholder="Enter phone number"
          />

          <p className="mt-1 text-sm text-gray-500">
            Optional
          </p>
        </div>

        {/* USER TYPE */}

        <div>
          <label className="mb-2 block font-medium">
            User Type *
          </label>

          <select
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            className="w-full rounded border p-3"
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
        </div>

        {/* ROLE */}

        <div>
          <label className="mb-2 block font-medium">
            Role *
          </label>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full rounded border p-3"
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
        </div>

        {/* DEPARTMENT */}

        <div>
          <label className="mb-2 block font-medium">
            Department
          </label>

          <select
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            className="w-full rounded border p-3"
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
        </div>

        {/* CLUB */}

        <div>
          <label className="mb-2 block font-medium">
            Club / Activity
          </label>

          <select
            name="clubId"
            value={formData.clubId}
            onChange={handleChange}
            className="w-full rounded border p-3"
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
        </div>

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-6 py-3 font-medium text-white disabled:opacity-50"
        >
          {saving
            ? "Creating User..."
            : "Create User"}
        </button>

      </form>

    </main>
  );
}