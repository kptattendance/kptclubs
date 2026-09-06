"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { getCurrentUser } from "@/lib/getCurrentUser";

export default function AuthRedirectPage() {
  const router = useRouter();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    const redirectUser = async () => {
      try {
        if (!isSignedIn) {
          router.replace("/sign-in");
          return;
        }

        const data = await getCurrentUser(getToken);

        console.log("Current user:", data);

        const user = data.user;

        if (!user) {
          console.error("No application user returned");
          router.replace("/unauthorized");
          return;
        }

        // ADMIN
        if (user.role === "ADMIN") {
          router.replace("/admin");
          return;
        }

        // HOD
        if (user.role === "HOD") {
          router.replace("/hod");
          return;
        }

        // CLUB INCHARGE
        if (user.role === "CLUB_INCHARGE") {
          if (!user.clubId) {
            console.error("Club In-Charge has no club assigned");
            router.replace("/unauthorized");
            return;
          }

          const clubCode = user.clubId.code;

          router.replace(
            `/club-incharge/${clubCode.toLowerCase()}`
          );

          return;
        }

        // CLUB OFFICER
        if (user.role === "CLUB_OFFICER") {
          if (!user.clubId) {
            console.error("Club Officer has no club assigned");
            router.replace("/unauthorized");
            return;
          }

          const clubCode = user.clubId.code;

          router.replace(
            `/club-officer/${clubCode.toLowerCase()}`
          );

          return;
        }

        // STUDENT
        if (user.role === "STUDENT") {
          router.replace("/student");
          return;
        }

        // Unknown role
        router.replace("/");

      } catch (error) {
        console.error(
          "Authentication redirect error:",
          error.response?.data || error.message
        );

        router.replace("/unauthorized");
      }
    };

    redirectUser();

  }, [
    isLoaded,
    isSignedIn,
    getToken,
    router,
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p>Loading your dashboard...</p>
    </main>
  );
}