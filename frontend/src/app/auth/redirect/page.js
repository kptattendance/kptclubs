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
    if (!isLoaded) {
      return;
    }


    const redirectUser = async () => {
      try {
        if (!isSignedIn) {
          router.replace("/sign-in");
          return;
        }

        const token = await getToken();


        if (!token) {
          console.error(
            "Clerk token is NULL"
          );

          router.replace("/unauthorized");
          return;
        }

        

        const data =
          await getCurrentUser(getToken);

       

        const user = data?.user;

        if (!user) {
          console.error(
            "No application user returned from backend."
          );

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
            console.error(
              "Club In-Charge has no club assigned."
            );

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
            console.error(
              "Club Officer has no club assigned."
            );

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

        console.error(
          "Unknown application role:",
          user.role
        );

        router.replace("/");
      } catch (error) {
        console.error(
          "================================"
        );

        console.error(
          "AUTH REDIRECT ERROR"
        );

        console.error(
          "Error:",
          error
        );

        console.error(
          "Response:",
          error?.response?.data
        );

        console.error(
          "Status:",
          error?.response?.status
        );

        console.error(
          "Message:",
          error?.message
        );

        console.error(
          "================================"
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">

        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

        <p className="mt-4 text-sm font-medium text-gray-600">
          Loading your dashboard...
        </p>

      </div>
    </main>
  );
}