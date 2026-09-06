import User from "../models/User.js";

const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findOne({
        clerkUserId: req.clerkUserId,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Application user not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "User account is inactive",
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action",
        });
      }

      // Make the MongoDB user available to controllers
      req.user = user;

      next();
    } catch (error) {
      console.error("Role middleware error:", error);

      return res.status(500).json({
        success: false,
        message: "Authorization failed",
      });
    }
  };
};

export default requireRole;