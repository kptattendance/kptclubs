import User from "../models/User.js";
import Department from "../models/Department.js";
import Club from "../models/Club.js";
import StudentProfile from "../models/StudentProfile.js";
import ClubMembership from "../models/ClubMembership.js";
import Attendance from "../models/Attendance.js";
import Certificate from "../models/Certificate.js";
import cloudinary from "../config/cloudinary.js";

import { clerkClient } from "@clerk/express";


// ============================================================
// CREATE USER
// ============================================================

export const createUser = async (req, res) => {
  try {

const {
  name,
  email,
  phone,
  userType,
  role,
  departmentId,
  clubId,
  profilePhoto,
} = req.body;
    // --------------------------------------------------------
    // Validate required fields
    // --------------------------------------------------------

    if (!name || !email || !userType || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, user type and role are required",
      });
    }


    // --------------------------------------------------------
    // Check MongoDB duplicate email
    // --------------------------------------------------------

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }


    // --------------------------------------------------------
    // Validate department
    // --------------------------------------------------------

    let department = null;

    if (departmentId) {
      department = await Department.findById(
        departmentId
      );

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
    }


    // --------------------------------------------------------
    // Validate club
    // --------------------------------------------------------

    let club = null;

    if (clubId) {
      club = await Club.findById(clubId);

      if (!club) {
        return res.status(404).json({
          success: false,
          message: "Club not found",
        });
      }
    }


    // --------------------------------------------------------
    // Role-specific validation
    // --------------------------------------------------------

    const clubRoles = [
      "CLUB_OFFICER",
      "CLUB_INCHARGE",
    ];

    if (
      clubRoles.includes(role) &&
      !clubId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Club is required for Club Officer and Club In-Charge",
      });
    }


    // --------------------------------------------------------
    // HOD must have department
    // --------------------------------------------------------

    if (
      role === "HOD" &&
      !departmentId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Department is required for HOD",
      });
    }


    // --------------------------------------------------------
    // Prevent duplicate Club In-Charge
    // --------------------------------------------------------

    if (role === "CLUB_INCHARGE") {

      const existingIncharge =
        await User.findOne({
          role: "CLUB_INCHARGE",
          clubId: clubId,
          isActive: true,
        });

      if (existingIncharge) {
        return res.status(409).json({
          success: false,
          message:
            "This club already has an active Club In-Charge",
        });
      }
    }


    // --------------------------------------------------------
    // Prevent duplicate HOD
    // --------------------------------------------------------

    if (role === "HOD") {

      const existingHod =
        await User.findOne({
          role: "HOD",
          departmentId: departmentId,
          isActive: true,
        });

      if (existingHod) {
        return res.status(409).json({
          success: false,
          message:
            "This department already has an active HOD",
        });
      }
    }


    // --------------------------------------------------------
    // CREATE CLERK USER
    // --------------------------------------------------------

    let clerkUser;

    try {

      clerkUser =
        await clerkClient.users.createUser({

          emailAddress: [email],

          skipPasswordRequirement: true,

          publicMetadata: {
            role: role,

            departmentId:
              departmentId || null,

            clubId:
              clubId || null,

            userType: userType,
          },
        });

    } catch (clerkError) {

      console.error(
        "Clerk user creation error:",
        clerkError
      );

      return res.status(500).json({
        success: false,
        message:
          clerkError?.errors?.[0]?.message ||
          "Failed to create Clerk user",
      });
    }


    // --------------------------------------------------------
    // CREATE MONGODB USER
    // --------------------------------------------------------

    let user;

    try {

      user = await User.create({
  clerkUserId: clerkUser.id,

  name: name.trim(),

  email: email.toLowerCase().trim(),

  phone: phone?.trim() || "",

  profilePhoto: profilePhoto || "",

  userType,

  role,

  departmentId: departmentId || null,

  clubId: clubId || null,

  isActive: true,
});

    } catch (mongoError) {

      console.error(
        "MongoDB user creation error:",
        mongoError
      );


      // ---------------------------------------------
      // Rollback Clerk user if MongoDB fails
      // ---------------------------------------------

      try {

        await clerkClient.users.deleteUser(
          clerkUser.id
        );

      } catch (rollbackError) {

        console.error(
          "Failed to rollback Clerk user:",
          rollbackError
        );
      }


      return res.status(500).json({
        success: false,
        message:
          "Failed to create MongoDB user",
      });
    }


    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.status(201).json({

      success: true,

      message:
        "User created successfully",

      user,

    });

  } catch (error) {

    console.error(
      "Create user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create user",
    });
  }
};



// ============================================================
// GET CURRENT USER
// ============================================================

export const getCurrentUser = async (
  req,
  res
) => {

  try {

    const user =
      await User.findOne({
        clerkUserId:
          req.clerkUserId,
      })
      .populate(
        "departmentId",
        "code name"
      )
      .populate(
        "clubId",
        "code name type"
      );


    if (!user) {

      return res.status(404).json({
        success: false,
        message:
          "Application user not found",
      });
    }


    return res.status(200).json({

      success: true,

      user,

    });

  } catch (error) {

    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get current user",
    });
  }
};



// ============================================================
// GET ALL USERS
// ============================================================

export const getUsers = async (
  req,
  res
) => {

  try {

    const users =
      await User.find()
        .populate(
          "departmentId",
          "code name"
        )
        .populate(
          "clubId",
          "code name type"
        )
        .sort({
          createdAt: -1,
        });


    return res.status(200).json({

      success: true,

      count:
        users.length,

      users,

    });

  } catch (error) {

    console.error(
      "Get users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch users",
    });
  }
};



// ============================================================
// GET USER BY ID
// ============================================================

export const getUserById = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    const user =
      await User.findById(id)
        .populate(
          "departmentId",
          "code name"
        )
        .populate(
          "clubId",
          "code name type"
        );


    if (!user) {

      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }


    return res.status(200).json({

      success: true,

      user,

    });

  } catch (error) {

    console.error(
      "Get user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch user",
    });
  }
};



// ============================================================
// UPDATE USER
// ============================================================

export const updateUser = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    const {
      name,
      email,
      phone,
      userType,
      role,
      departmentId,
      clubId,
      photoUrl,
      photoPublicId,
    } = req.body;


    const user =
      await User.findById(id);


    if (!user) {

      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }


    // --------------------------------------------------------
    // Validate department
    // --------------------------------------------------------

    if (departmentId) {

      const department =
        await Department.findById(
          departmentId
        );

      if (!department) {

        return res.status(404).json({
          success: false,
          message:
            "Department not found",
        });
      }
    }


    // --------------------------------------------------------
    // Validate club
    // --------------------------------------------------------

    if (clubId) {

      const club =
        await Club.findById(
          clubId
        );

      if (!club) {

        return res.status(404).json({
          success: false,
          message:
            "Club not found",
        });
      }
    }


    // --------------------------------------------------------
    // Role validation
    // --------------------------------------------------------

    const finalRole =
      role || user.role;

    const finalClubId =
      clubId !== undefined
        ? clubId
        : user.clubId;

    const finalDepartmentId =
      departmentId !== undefined
        ? departmentId
        : user.departmentId;


    if (
      [
        "CLUB_OFFICER",
        "CLUB_INCHARGE",
      ].includes(finalRole) &&
      !finalClubId
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Club is required for Club Officer and Club In-Charge",
      });
    }


    if (
      finalRole === "HOD" &&
      !finalDepartmentId
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Department is required for HOD",
      });
    }


    // --------------------------------------------------------
    // Update Clerk metadata
    // --------------------------------------------------------

    if (user.clerkUserId) {

      await clerkClient.users.updateUserMetadata(
        user.clerkUserId,
        {
          publicMetadata: {

            role:
              finalRole,

            departmentId:
              finalDepartmentId || null,

            clubId:
              finalClubId || null,

            userType:
              userType || user.userType,
          },
        }
      );
    }


    // --------------------------------------------------------
    // Handle photo replacement
    // --------------------------------------------------------

    if (
      photoPublicId &&
      photoPublicId !== user.photoPublicId &&
      user.photoPublicId
    ) {

      try {

        await cloudinary.uploader.destroy(
          user.photoPublicId
        );

      } catch (error) {

        console.error(
          "Old Cloudinary photo deletion failed:",
          error
        );
      }
    }


    // --------------------------------------------------------
    // Update MongoDB
    // --------------------------------------------------------

    if (name !== undefined)
      user.name =
        name.trim();

    if (email !== undefined)
      user.email =
        email.toLowerCase().trim();

    if (phone !== undefined)
      user.phone =
        phone?.trim() || null;

    if (userType !== undefined)
      user.userType =
        userType;

    if (role !== undefined)
      user.role =
        role;

    if (departmentId !== undefined)
      user.departmentId =
        departmentId || null;

    if (clubId !== undefined)
      user.clubId =
        clubId || null;

    if (photoUrl !== undefined)
      user.photoUrl =
        photoUrl || null;

    if (photoPublicId !== undefined)
      user.photoPublicId =
        photoPublicId || null;


    await user.save();


    return res.status(200).json({

      success: true,

      message:
        "User updated successfully",

      user,

    });

  } catch (error) {

    console.error(
      "Update user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update user",
    });
  }
};



// ============================================================
// UPDATE USER STATUS
// ============================================================

export const updateUserStatus = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;

    const { isActive } =
      req.body;


    if (
      typeof isActive !==
      "boolean"
    ) {

      return res.status(400).json({
        success: false,
        message:
          "isActive must be true or false",
      });
    }


    const user =
      await User.findById(id);


    if (!user) {

      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }


    user.isActive =
      isActive;

    await user.save();


    // --------------------------------------------------------
    // Update Clerk metadata
    // --------------------------------------------------------

    if (user.clerkUserId) {

      await clerkClient.users.updateUserMetadata(
        user.clerkUserId,
        {
          publicMetadata: {
            role:
              user.role,

            departmentId:
              user.departmentId || null,

            clubId:
              user.clubId || null,

            userType:
              user.userType,

            isActive:
              isActive,
          },
        }
      );
    }


    return res.status(200).json({

      success: true,

      message:
        isActive
          ? "User activated successfully"
          : "User deactivated successfully",

      user,

    });

  } catch (error) {

    console.error(
      "Update user status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update user status",
    });
  }
};



// ============================================================
// DELETE USER
// ============================================================

// ============================================================
// DELETE USER
// ============================================================

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // --------------------------------------------------------
    // FIND USER
    // --------------------------------------------------------

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------------------------------
    // PREVENT ADMIN FROM DELETING HIMSELF
    // --------------------------------------------------------

    if (req.userId?.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // --------------------------------------------------------
    // IF STUDENT, DELETE STUDENT-RELATED DATA
    // --------------------------------------------------------

    if (user.role === "STUDENT") {
      const studentProfile = await StudentProfile.findOne({
        userId: user._id,
      });

      if (studentProfile) {
        const studentId = studentProfile._id;

        // Delete attendance records
        await Attendance.deleteMany({
          studentId,
        });

        // Delete certificate records
        await Certificate.deleteMany({
          studentId,
        });

        // Delete club memberships
        await ClubMembership.deleteMany({
          studentId,
        });

        // Delete student profile
        await StudentProfile.findByIdAndDelete(
          studentId
        );
      }
    }

    // --------------------------------------------------------
    // DELETE CLOUDINARY PHOTO
    // --------------------------------------------------------

    if (user.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(
          user.photoPublicId
        );
      } catch (error) {
        console.error(
          "Cloudinary deletion failed:",
          error
        );

        // Continue with database deletion
      }
    }

    // --------------------------------------------------------
    // DELETE CLERK USER
    // --------------------------------------------------------
if (user.clerkUserId) {
  try {
    await clerkClient.users.deleteUser(
      user.clerkUserId
    );

    console.log(
      "Clerk user deleted:",
      user.clerkUserId
    );

  } catch (error) {

    if (error?.status === 404) {
      console.log(
        "Clerk user already does not exist:",
        user.clerkUserId
      );
    } else {
      console.error(
        "Clerk deletion failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete user from Clerk",
      });
    }
  }
}

    // --------------------------------------------------------
    // DELETE MONGODB USER
    // --------------------------------------------------------

    await User.findByIdAndDelete(id);

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        user.role === "STUDENT"
          ? "Student and all related data deleted successfully"
          : "User deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete user",
    });
  }
};