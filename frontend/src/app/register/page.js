"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import api from "@/lib/api";
import Link from "next/link";

export default function StudentRegisterPage() {

    const { getToken } = useAuth();

    const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

    const [departments, setDepartments] = useState([]);
    const [clubs, setClubs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        registerNumber: "",
        departmentId: "",
        semester: "",
        admissionYear: "",
        clubId: "",
    });

    // =====================================================
    // LOAD DEPARTMENTS + CLUBS
    // =====================================================

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [departmentResponse, clubResponse] =
                    await Promise.all([
                        api.get("/api/departments"),
                        api.get("/api/student/clubs"),
                    ]);

                setDepartments(
                    departmentResponse.data.departments || []
                );

                setClubs(
                    clubResponse.data.clubs || []
                );

            } catch (error) {
                console.error(
                    "Failed to load registration data:",
                    error.response?.data || error.message
                );

                setError(
                    error.response?.data?.message ||
                    "Failed to load registration information"
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);


    // =====================================================
    // HANDLE INPUT
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };


    // =====================================================
    // HANDLE PHOTO
    // =====================================================

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            setPhoto(null);
            setPhotoPreview("");
            return;
        }


        // Check file type

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }


        // Maximum 5 MB

        if (file.size > 5 * 1024 * 1024) {
            setError("Photo size must be less than 5 MB");
            return;
        }


        setError("");

        setPhoto(file);

        setPhotoPreview(
            URL.createObjectURL(file)
        );
    };


    // =====================================================
    // SUBMIT REGISTRATION
    // =====================================================
    // =====================================================
    // UPLOAD PHOTO TO CLOUDINARY
    // =====================================================

  const uploadPhoto = async (photoFile) => {
    try {

        console.log("========== UPLOAD PHOTO ==========");

        console.log("Photo received:", photoFile);

        if (!photoFile) {
            throw new Error("No photo selected");
        }

        const uploadData = new FormData();

        // IMPORTANT:
        // This must match upload.single("image")
        uploadData.append("image", photoFile);

        console.log(
            "FormData image:",
            uploadData.get("image")
        );

        const token = await getToken();

        console.log("Starting Cloudinary upload...");

        const response = await axios.post(
            `${API_URL}/api/uploads/profile-photo`,
            uploadData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // DO NOT ADD Content-Type HERE
                },
            }
        );

        console.log(
            "========== UPLOAD RESPONSE =========="
        );

        console.log(response.data);

        if (
            !response.data?.success ||
            !response.data?.photoUrl
        ) {
            throw new Error(
                "Cloudinary did not return photo URL"
            );
        }

        console.log(
            "PHOTO URL:",
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
    // STUDENT REGISTRATION
    // =====================================================
const handleSubmit = async (e) => {

    e.preventDefault();

    console.log(
        "========== STUDENT REGISTRATION =========="
    );

    setError("");
    setSuccess("");

    try {

        setSubmitting(true);

        // =================================================
        // VALIDATE PHOTO
        // =================================================

        if (!photo) {
            throw new Error(
                "Student photo is required"
            );
        }

        // =================================================
        // STEP 1: UPLOAD PHOTO
        // =================================================

        console.log(
            "========== STEP 1: PHOTO UPLOAD =========="
        );

        const photoUrl = await uploadPhoto(photo);

        console.log(
            "PHOTO UPLOAD SUCCESS:",
            photoUrl
        );

        // =================================================
        // STEP 2: CREATE STUDENT PROFILE
        // =================================================

        console.log(
            "========== STEP 2: STUDENT REGISTRATION =========="
        );

        const studentData = {

            name:
                form.name
                    .trim(),

            email:
                form.email
                    .trim()
                    .toLowerCase(),

            phone:
                form.phone
                    .trim(),

            registerNumber:
                form.registerNumber
                    .trim()
                    .toUpperCase(),

            departmentId:
                form.departmentId,

            semester:
                Number(form.semester),

            admissionYear:
                Number(form.admissionYear),

            photoUrl:
                photoUrl,

            clubId:
                form.clubId,
        };

        console.log(
            "STUDENT DATA:",
            studentData
        );

        const token = await getToken();

        const response = await axios.post(
            `${API_URL}/api/student/register`,
            studentData,
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
            "========== REGISTRATION SUCCESS =========="
        );

        console.log(response.data);

        setSuccess(
            response.data.message ||
            "Student registration successful"
        );

        // =================================================
        // RESET FORM
        // =================================================

        setForm({
            name: "",
            email: "",
            phone: "",
            registerNumber: "",
            departmentId: "",
            semester: "",
            admissionYear: "",
            clubId: "",
        });

        setPhoto(null);
        setPhotoPreview("");

    } catch (error) {

        console.error(
            "Student registration error:",
            error.response?.data ||
            error.message
        );

        setError(
            error.response?.data?.message ||
            error.message ||
            "Student registration failed"
        );

    } finally {

        setSubmitting(false);

    }
};

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">

                <p className="text-slate-600">
                    Loading registration form...
                </p>

            </main>
        );
    }


    // =====================================================
    // PAGE
    // =====================================================

    return (
        <main className="min-h-screen bg-slate-50">

            {/* =================================================
          HEADER
      ================================================= */}

            <header className="bg-gradient-to-r from-indigo-600 to-purple-600">

                <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">

                    <Link
                        href="/"
                        className="text-sm text-indigo-100 hover:text-white"
                    >
                        ← Back to Home
                    </Link>

                    <h1 className="mt-5 text-3xl font-bold text-white sm:text-4xl">
                        Student Registration
                    </h1>

                    <p className="mt-2 text-sm text-indigo-100 sm:text-base">
                        Register your student profile and apply for a club.
                    </p>

                </div>

            </header>


            {/* =================================================
          FORM
      ================================================= */}

            <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">

                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8"
                >

                    {/* =================================================
              PHOTO
          ================================================= */}

                    <div className="mb-8">

                        <h2 className="text-lg font-semibold text-slate-800">
                            Student Photo
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Upload a clear passport-size photograph.
                        </p>


                        <div className="mt-5 flex flex-col items-center">

                            {/* Preview */}

                            {photoPreview ? (

                                <img
                                    src={photoPreview}
                                    alt="Student preview"
                                    className="h-32 w-32 rounded-full object-cover ring-4 ring-indigo-100"
                                />

                            ) : (

                                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 text-4xl">
                                    👤
                                </div>

                            )}


                            <label
                                htmlFor="photo"
                                className="mt-4 cursor-pointer rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                {photo
                                    ? "Change Photo"
                                    : "Choose Photo"}
                            </label>

                            <input
                                id="photo"
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />

                            <p className="mt-2 text-xs text-slate-400">
                                JPG, JPEG or PNG · Maximum 5 MB
                            </p>

                        </div>

                    </div>


                    {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

                    <div className="border-t pt-7">

                        <h2 className="text-lg font-semibold text-slate-800">
                            Personal Information
                        </h2>


                        <div className="mt-5 grid gap-5 sm:grid-cols-2">


                            {/* NAME */}

                            <div className="sm:col-span-2">

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    required
                                />

                            </div>


                            {/* EMAIL */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Email ID
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="student@example.com"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    required
                                />

                                <p className="mt-1 text-xs text-slate-400">
                                    This email will be used as your unique identifier.
                                </p>

                            </div>


                            {/* PHONE */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    required
                                />

                            </div>


                            {/* REGISTER NUMBER */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Register Number
                                </label>

                                <input
                                    type="text"
                                    name="registerNumber"
                                    value={form.registerNumber}
                                    onChange={handleChange}
                                    placeholder="Enter register number"
                                    className="w-full uppercase rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    required
                                />

                            </div>


                            {/* DEPARTMENT */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Department
                                </label>

                                <select
                                    name="departmentId"
                                    value={form.departmentId}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    required
                                >

                                    <option value="">
                                        Select Department
                                    </option>

                                    {departments.map((department) => (

                                        <option
                                            key={department._id}
                                            value={department._id}
                                        >
                                            {department.code} - {department.name}
                                        </option>

                                    ))}

                                </select>

                            </div>


                            {/* SEMESTER */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Semester
                                </label>

                                <select
                                    name="semester"
                                    value={form.semester}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    required
                                >

                                    <option value="">
                                        Select Semester
                                    </option>

                                    {[1, 2, 3, 4, 5, 6].map(
                                        (semester) => (

                                            <option
                                                key={semester}
                                                value={semester}
                                            >
                                                Semester {semester}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* ADMISSION YEAR */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Admission Year
                                </label>

                                <input
                                    type="number"
                                    name="admissionYear"
                                    value={form.admissionYear}
                                    onChange={handleChange}
                                    placeholder="2026"
                                    min="2000"
                                    max="2100"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    required
                                />

                            </div>

                        </div>

                    </div>


                    {/* =================================================
              CLUB SELECTION
          ================================================= */}

                    <div className="mt-8 border-t pt-7">

                        <h2 className="text-lg font-semibold text-slate-800">
                            Club Selection
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Select the club you would like to join.
                        </p>


                        <div className="mt-5">

                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Club
                            </label>

                            <select
                                name="clubId"
                                value={form.clubId}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                required
                            >

                                <option value="">
                                    Select Club
                                </option>

                                {clubs.map((club) => (

                                    <option
                                        key={club._id}
                                        value={club._id}
                                    >
                                        {club.code} - {club.name}
                                    </option>

                                ))}

                            </select>

                        </div>


                        {/* Approval information */}

                        <div className="mt-5 rounded-lg bg-indigo-50 p-4">

                            <p className="text-sm font-medium text-indigo-800">
                                Club Approval Process
                            </p>

                            <p className="mt-1 text-sm leading-6 text-indigo-700">
                                After registration, your application will first
                                be reviewed by the Club Incharge and then by your
                                HOD. You can join the club only after both
                                approvals.
                            </p>

                        </div>

                    </div>


                    {/* =================================================
              ERROR
          ================================================= */}

                    {error && (

                        <div className="mt-6 rounded-lg bg-red-50 p-4">

                            <p className="text-sm font-medium text-red-700">
                                {error}
                            </p>

                        </div>

                    )}


                    {/* =================================================
              SUCCESS
          ================================================= */}

                    {success && (

                        <div className="mt-6 rounded-lg bg-green-50 p-4">

                            <p className="text-sm font-medium text-green-700">
                                {success}
                            </p>

                        </div>

                    )}


                    {/* =================================================
              SUBMIT
          ================================================= */}

                    <div className="mt-8 border-t pt-6">

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-lg bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >

                            {submitting
                                ? "Submitting Registration..."
                                : "Submit Registration"}

                        </button>

                    </div>

                </form>

            </section>

        </main>
    );
}