import User from "../models/User.js";

const resolveUser = async (req, res, next) => {
  try {

    // requireAuth must run before this middleware
    if (!req.clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find MongoDB application user
    const user = await User.findOne({
      clerkUserId: req.clerkUserId,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Application user not found",
      });
    }

    // MongoDB User document
    req.user = user;

    // MongoDB User._id
    req.userId = user._id;

    next();

  } catch (error) {

    console.error(
      "Resolve user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to resolve application user",
    });
  }
};

export default resolveUser;