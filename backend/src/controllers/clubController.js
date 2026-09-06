
import Club from "../models/Club.js";
import User from "../models/User.js";

export const getClubDashboard = async (req, res) => {
  try {
    const clubId = req.user.clubId;
console.log(clubId)
    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: "No club assigned to this user",
      });
    }

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    // Count students belonging to this club
    const studentCount = await User.countDocuments({
      clubId: club._id,
      userType: "STUDENT",
      isActive: true,
    });

    // Find club in-charge
    const clubIncharge = await User.findOne({
      clubId: club._id,
      role: "CLUB_INCHARGE",
      isActive: true,
    }).populate("departmentId");

    return res.status(200).json({
      success: true,

      club: {
        id: club._id,
        name: club.name,
        code: club.code,
        type: club.type,
        description: club.description,
      },

      studentCount,

      clubIncharge: clubIncharge
        ? {
            id: clubIncharge._id,
            name: clubIncharge.name,
            email: clubIncharge.email,
            phone: clubIncharge.phone,
            image: clubIncharge.profilePhoto,
            department: clubIncharge.departmentId
              ? clubIncharge.departmentId.name
              : null,
            role: clubIncharge.role,
          }
        : null,
    });
  } catch (error) {
    console.error("Club dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load club dashboard",
    });
  }
};
// Get all clubs
export const getClubs = async (req, res) => {
  try {
    const clubs = await Club.find()
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      clubs,
    });
  } catch (error) {
    console.error("Get clubs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch clubs",
    });
  }
};


// Get active clubs
export const getActiveClubs = async (req, res) => {
  try {
    const clubs = await Club.find({
      isActive: true,
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      clubs,
    });
  } catch (error) {
    console.error("Get active clubs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch active clubs",
    });
  }
};


// Get clubs by type
export const getClubsByType = async (req, res) => {
  try {
    const clubs = await Club.find({
      type: req.params.type,
      isActive: true,
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      clubs,
    });
  } catch (error) {
    console.error("Get clubs by type error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch clubs",
    });
  }
};


// Get single club
export const getClubById = async (req, res) => {
  try {
    const club = await Club.findById(
      req.params.id
    );

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    res.status(200).json({
      success: true,
      club,
    });
  } catch (error) {
    console.error("Get club error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch club",
    });
  }
};


// Create club
export const createClub = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      description,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Name and code are required",
      });
    }

    const existingClub =
      await Club.findOne({
        $or: [
          { name: name.trim() },
          { code: code.toUpperCase().trim() },
        ],
      });

    if (existingClub) {
      return res.status(409).json({
        success: false,
        message:
          "Club with this name or code already exists",
      });
    }

    const club = await Club.create({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      type: type || "CLUB",
      description: description?.trim() || "",
    });

    res.status(201).json({
      success: true,
      message: "Club created successfully",
      club,
    });
  } catch (error) {
    console.error("Create club error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create club",
    });
  }
};


// Update club
export const updateClub = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      description,
      isActive,
    } = req.body;

    const club =
      await Club.findById(
        req.params.id
      );

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    if (name !== undefined) {
      club.name = name.trim();
    }

    if (code !== undefined) {
      club.code =
        code.toUpperCase().trim();
    }

    if (type !== undefined) {
      club.type = type;
    }

    if (description !== undefined) {
      club.description =
        description.trim();
    }

    if (isActive !== undefined) {
      club.isActive = isActive;
    }

    await club.save();

    res.status(200).json({
      success: true,
      message: "Club updated successfully",
      club,
    });
  } catch (error) {
    console.error("Update club error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update club",
    });
  }
};


// Delete club
export const deleteClub = async (req, res) => {
  try {
    const club =
      await Club.findByIdAndDelete(
        req.params.id
      );

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Club deleted successfully",
    });
  } catch (error) {
    console.error("Delete club error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete club",
    });
  }
};