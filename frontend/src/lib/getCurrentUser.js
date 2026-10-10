import api from "./api";

// The signed-in user's profile is needed by several components
// on every page (layout, role guard). Share one request between
// them and reuse the answer for a short time.
const CACHE_MS = 30 * 1000;

let cached = null;

// Clerk user ID stored in the session token
const getTokenSubject = (token) => {
  try {
    const payload = token
      .split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    return JSON.parse(atob(payload)).sub || null;
  } catch {
    return null;
  }
};

export const clearCurrentUserCache = () => {
  cached = null;
};

export const getCurrentUser = async (getToken) => {
  const token = await getToken();

  const subject = token ? getTokenSubject(token) : null;

  if (
    subject &&
    cached &&
    cached.subject === subject &&
    cached.expiresAt > Date.now()
  ) {
    return cached.promise;
  }

  const promise = api
    .get("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((response) => response.data);

  if (subject) {
    cached = {
      subject,
      expiresAt: Date.now() + CACHE_MS,
      promise,
    };

    // Never keep a failed request
    promise.catch(() => {
      if (cached?.promise === promise) {
        cached = null;
      }
    });
  }

  return promise;
};
