import { getAuth, clerkClient } from "@clerk/express";

import User from "../models/User.js";

export const authenticateUser = async (req, res) => {
  try {

    console.log("========== AUTH ME ==========");

    // Get authenticated Clerk session
    const { isAuthenticated, userId } = getAuth(req);

    console.log("Authenticated:", isAuthenticated);
    console.log("Clerk User ID:", userId);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ============================================
    // GET CLERK USER
    // ============================================

    const clerkUser =
      await clerkClient.users.getUser(userId);

    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress
        ?.toLowerCase();

    const name =
      `${clerkUser.firstName || ""} ${
        clerkUser.lastName || ""
      }`.trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "No email address found in Clerk account",
      });
    }

    // ============================================
    // FIND APPLICATION USER USING CLERK ID
    // ============================================

    let user = await User.findOne({
      clerkUserId: userId,
    });

    // ============================================
    // FALLBACK: FIND USING EMAIL
    // ============================================

    if (!user) {

      user = await User.findOne({
        email,
      });

      if (user) {

        user.clerkUserId = userId;

        if (name) {
          user.name = name;
        }

        await user.save();

        console.log(
          `Linked existing user with Clerk: ${email}`
        );
      }
    }

    // ============================================
    // NEW CLERK USER
    // ============================================

    if (!user) {

      user = await User.create({
        clerkUserId: userId,
        email,
        name: name || email,
        userType: "STUDENT",
        role: "STUDENT",
      });

      console.log(
        `New student created: ${email}`
      );
    }

    // ============================================
    // ACTIVE CHECK
    // ============================================

    if (!user.isActive) {

      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated",
      });
    }

    // ============================================
    // POPULATE DEPARTMENT
    // ============================================

    await user.populate(
      "departmentId"
    );

    // ============================================
    // POPULATE CLUB
    // ============================================

    await user.populate(
      "clubId"
    );

    return res.status(200).json({

      success: true,

      user: {

        id: user._id,

        clerkUserId:
          user.clerkUserId,

        email:
          user.email,

        name:
          user.name,

        userType:
          user.userType,

        role:
          user.role,

        departmentId:
          user.departmentId,

        clubId:
          user.clubId,

        isActive:
          user.isActive,

      },

    });

  } catch (error) {

    console.error(
      "Authenticate user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to authenticate user",
    });
  }
};