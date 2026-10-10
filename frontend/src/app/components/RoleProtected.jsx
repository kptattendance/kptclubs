"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { getCurrentUser } from "@/lib/getCurrentUser";

const ROLE_HOME = {
  ADMIN: "/admin",
  HOD: "/hod",
  PRINCIPAL: "/principal",
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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // A stable value, so the check does not run again
  // every time the parent layout re-renders.
  const allowedRolesKey = allowedRoles
    .map((item) => String(item).trim().toUpperCase())
    .join(",");

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

        const data = await getCurrentUser(getToken);

        if (cancelled) {
          return;
        }

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

        const roleAllowed = allowedRolesKey
          .split(",")
          .includes(role);

        if (!roleAllowed) {
          const correctHome = ROLE_HOME[role];

          if (correctHome) {
            if (
              role === "CLUB_INCHARGE" ||
              role === "CLUB_OFFICER"
            ) {
              const clubCode = user.clubId?.code;

              if (clubCode) {
                router.replace(
                  `${correctHome}/${String(
                    clubCode
                  ).toLowerCase()}`
                );

                return;
              }

              router.replace("/unauthorized");
              return;
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

          const requestedClubCode = pathParts[1];

          const actualClubCode = user.clubId?.code;

          if (
            !requestedClubCode ||
            !actualClubCode
          ) {
            router.replace("/unauthorized");
            return;
          }

          const requestedCode = String(requestedClubCode)
            .trim()
            .toLowerCase();

          const actualCode = String(actualClubCode)
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

        setFailed(false);
        setChecking(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const status = error?.response?.status;

        console.error(
          "Role protection error:",
          status || error?.message
        );

        // The server answered "not allowed"
        if (
          status === 401 ||
          status === 403 ||
          status === 404
        ) {
          router.replace("/unauthorized");
          return;
        }

        // Network problem or the server is waking up:
        // let the user retry instead of sending them away.
        setFailed(true);
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
    allowedRolesKey,
    attempt,
  ]);

  if (failed && checking) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-900">
            Could not reach the server
          </p>

          <p className="mt-2 text-sm text-gray-600">
            Please check your internet connection and try again.
          </p>

          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
            className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (
    !isLoaded ||
    checking
  ) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
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
