import { getAuth, clerkClient } from "@clerk/express";

import User from "../models/User.js";

const USER_POPULATE = [
  {
    path: "departmentId",
  },
  {
    path: "clubId",
  },
];

export const authenticateUser = async (req, res) => {
  try {
    // Get authenticated Clerk session
    const { isAuthenticated, userId } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ============================================
    // FIND APPLICATION USER USING CLERK ID
    //
    // This is the normal case and needs only one
    // database query. Clerk's API is called only
    // the first time a person signs in.
    // ============================================

    let user = await User.findOne({
      clerkUserId: userId,
    }).populate(USER_POPULATE);

    if (!user) {
      // ============================================
      // GET CLERK USER
      // ============================================

      const clerkUser =
        await clerkClient.users.getUser(userId);

      const primaryEmail =
        clerkUser.emailAddresses?.find(
          (item) =>
            item.id === clerkUser.primaryEmailAddressId
        ) || clerkUser.emailAddresses?.[0];

      const email =
        primaryEmail?.emailAddress?.toLowerCase();

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
      // FALLBACK: FIND USING EMAIL
      // ============================================

      user = await User.findOne({
        email,
      });

      if (user) {
        // An existing account (possibly a staff account) may only
        // be linked to a sign-in whose email has been verified.
        if (
          primaryEmail.verification?.status !== "verified"
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Please verify your email address before signing in",
          });
        }

        user.clerkUserId = userId;

        await user.save();
      } else {
        // ============================================
        // NEW CLERK USER
        // ============================================

        user = await User.create({
          clerkUserId: userId,
          email,
          name: name || email,
          userType: "STUDENT",
          role: "STUDENT",
        });
      }

      await user.populate(USER_POPULATE);
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

    return res.status(200).json({
      success: true,

      user: {
        id: user._id,

        clerkUserId: user.clerkUserId,

        email: user.email,

        name: user.name,

        userType: user.userType,

        role: user.role,

        departmentId: user.departmentId,

        clubId: user.clubId,

        isActive: user.isActive,
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
