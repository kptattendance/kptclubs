import express from "express";

import {
  getAdminRegistrationSummary,
} from "../controllers/adminController.js";

const router = express.Router();

// --------------------------------------------------
// The registration summary is shown on the public home
// page and only contains totals. It is expensive to build,
// so each filter combination is cached for one minute.
// --------------------------------------------------

const SUMMARY_TTL_MS = 60 * 1000;
const SUMMARY_MAX_ENTRIES = 200;

const summaryCache = new Map();

const cacheSummary = (req, res, next) => {
  const key = JSON.stringify([
    req.query.department,
    req.query.semester,
    req.query.club,
  ]);

  const cached = summaryCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return res.status(200).json(cached.body);
  }

  const sendJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode === 200) {
      if (summaryCache.size >= SUMMARY_MAX_ENTRIES) {
        summaryCache.clear();
      }

      summaryCache.set(key, {
        body,
        expiresAt: Date.now() + SUMMARY_TTL_MS,
      });
    }

    return sendJson(body);
  };

  next();
};

router.get(
  "/registration-summary",
  cacheSummary,
  getAdminRegistrationSummary
);

export default router;
