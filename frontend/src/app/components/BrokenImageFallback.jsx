"use client";

import { useEffect } from "react";

// A neutral "person" placeholder
const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#e2e8f0"/><circle cx="48" cy="38" r="16" fill="#94a3b8"/><path d="M16 88c0-18 14-30 32-30s32 12 32 30z" fill="#94a3b8"/></svg>'
  );

// When any photo on the site fails to load (for example a link
// to the old photo storage), show a placeholder instead of the
// browser's broken-image icon.
export default function BrokenImageFallback() {
  useEffect(() => {
    const handleError = (event) => {
      const image = event.target;

      if (
        !(image instanceof HTMLImageElement) ||
        image.dataset.fallbackApplied
      ) {
        return;
      }

      image.dataset.fallbackApplied = "true";
      image.src = PLACEHOLDER;
    };

    // "error" does not bubble, so listen in the capture phase
    document.addEventListener("error", handleError, true);

    return () => {
      document.removeEventListener("error", handleError, true);
    };
  }, []);

  return null;
}
