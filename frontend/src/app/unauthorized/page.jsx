import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">

      <div className="w-full max-w-lg">

        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">

          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <span className="text-4xl">
              🎓
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">
            KPT Club Portal
          </h1>

          <h2 className="mt-3 text-lg font-semibold text-gray-700">
            Student Registration Required
          </h2>

          {/* Message */}
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500">
            You have successfully signed in, but your account is not
            registered in the KPT Club Management System.
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            If you are a student of KPT, please complete your student
            registration before accessing the club portal.
          </p>

          {/* Information box */}
          <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-left">

            <div className="flex gap-3">

              <div className="mt-0.5 text-xl">
                ℹ️
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  New KPT Student?
                </p>

                <p className="mt-1 text-sm leading-5 text-blue-700">
                  Register your student details, department and
                  preferred club to submit your membership application.
                </p>
              </div>

            </div>

          </div>

          {/* Register button */}
          <Link
            href="/student/register"
            className="mt-7 block w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Register as Student
          </Link>

          {/* Back to login */}
          <Link
            href="/sign-in"
            className="mt-3 block w-full rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to Sign In
          </Link>

          {/* Footer */}
          <div className="mt-8 border-t border-gray-100 pt-5">

            <p className="text-xs text-gray-400">
              KPT Club Management Portal
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Student • Club • HOD Management System
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}