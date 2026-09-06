import { getAuth } from "@clerk/express";

const requireAuth = (req, res, next) => {
  const { isAuthenticated, userId } = getAuth(req);
    console.log("========== REQUIRE AUTH ==========");
  console.log("Clerk User ID:", userId);
  console.log("Authenticated:", isAuthenticated);


  if (!isAuthenticated || !userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  req.clerkUserId = userId;

  next();
};

export default requireAuth;