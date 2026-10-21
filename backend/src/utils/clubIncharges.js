import User from "../models/User.js";

// Active Club In-charge of each club, as { clubId: incharge }.
// One query for all clubs.
export const getClubInchargeMap = async (clubIds = null) => {
  const query = {
    role: "CLUB_INCHARGE",
    isActive: true,
    clubId: clubIds ? { $in: clubIds } : { $ne: null },
  };

  const incharges = await User.find(query)
    .select("name email phone profilePhoto clubId departmentId")
    .populate("departmentId", "code name")
    .lean();

  const map = new Map();

  incharges.forEach((user) => {
    map.set(String(user.clubId), {
      id: user._id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      photoUrl: user.profilePhoto || "",
      department: user.departmentId
        ? {
            code: user.departmentId.code,
            name: user.departmentId.name,
          }
        : null,
    });
  });

  return map;
};
