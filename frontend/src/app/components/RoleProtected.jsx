"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { getCurrentUser } from "@/lib/getCurrentUser";

const ROLE_HOME = {
  ADMIN: "/admin",
  HOD: "/hod",
  CLUB_INCHARGE: "/club-incharge",
  CLUB_OFFICER: "/club-officer",
  STUDENT: "/student",
};

export default function RoleProtected({
  allowedRoles = [],
  children,
  checkClub = false,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let cancelled = false;

    const verifyAccess = async () => {
      try {
        if (!isSignedIn) {
          router.replace("/sign-in");
          return;
        }

        const token = await getToken();

        if (!token) {
          router.replace("/unauthorized");
          return;
        }

        const data = await getCurrentUser(getToken);

        const user = data?.user;

        if (!user) {
          router.replace("/unauthorized");
          return;
        }

        const role = String(user.role || "")
          .trim()
          .toUpperCase();

        if (!role) {
          router.replace("/unauthorized");
          return;
        }

        const normalizedAllowedRoles =
          allowedRoles.map((item) =>
            String(item).trim().toUpperCase()
          );

        const roleAllowed =
          normalizedAllowedRoles.includes(role);

        if (!roleAllowed) {
          const correctHome =
            ROLE_HOME[role];

          if (correctHome) {
            if (
              role === "CLUB_INCHARGE" ||
              role === "CLUB_OFFICER"
            ) {
              const clubCode =
                user.clubId?.code;

              if (clubCode) {
                const base =
                  role === "CLUB_INCHARGE"
                    ? "/club-incharge"
                    : "/club-officer";

                router.replace(
                  `${base}/${String(
                    clubCode
                  ).toLowerCase()}`
                );
                return;
              }
            }

            router.replace(correctHome);
            return;
          }

          router.replace("/unauthorized");
          return;
        }

        if (checkClub) {
          const pathParts = pathname
            .split("/")
            .filter(Boolean);

          const requestedClubCode =
            pathParts[1];

          const actualClubCode =
            user.clubId?.code;

          if (
            !requestedClubCode ||
            !actualClubCode
          ) {
            router.replace("/unauthorized");
            return;
          }

          const requestedCode =
            String(requestedClubCode)
              .trim()
              .toLowerCase();

          const actualCode =
            String(actualClubCode)
              .trim()
              .toLowerCase();

          if (requestedCode !== actualCode) {
            const correctBase =
              role === "CLUB_INCHARGE"
                ? "/club-incharge"
                : "/club-officer";

            router.replace(
              `${correctBase}/${actualCode}`
            );

            return;
          }
        }

        if (!cancelled) {
          setChecking(false);
        }
      } catch (error) {
        console.error(
          "ROLE PROTECTION ERROR:",
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

        router.replace("/unauthorized");
      }
    };

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    getToken,
    router,
    pathname,
    checkClub,
    allowedRoles,
  ]);

  if (
    !isLoaded ||
    checking
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-medium text-gray-600">
            Checking access...
          </p>
        </div>
      </main>
    );
  }

  return children;
}