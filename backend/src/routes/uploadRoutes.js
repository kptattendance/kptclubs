import express from "express";
import {
  uploadProfilePhoto,
} from "../controllers/uploadController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// router.post(
//   "/profile-photo",
//   upload.single("image"),
//   uploadProfilePhoto
// );

router.post(
  "/profile-photo",
  upload.single("image"),
  (req, res, next) => {
    console.log("========== MULTER CHECK ==========");
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);
    console.log("==================================");

    next();
  },
  uploadProfilePhoto
);

export default router;