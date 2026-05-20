/**
 * ============================================================
 * FinovaWealth — User Controller
 * File: controllers/userController.js
 * ============================================================
 */

const User = require("../models/User");

/**
 * PUT /api/users/profile
 * Updates the authenticated user's profile fields.
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, investmentGoals, riskProfile } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update allowed fields
    if (fullName !== undefined) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim() || null;
    if (investmentGoals !== undefined) user.investmentGoals = investmentGoals;
    if (riskProfile !== undefined) user.riskProfile = riskProfile;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          authProvider: user.authProvider,
          riskProfile: user.riskProfile,
          investmentGoals: user.investmentGoals,
          intentScore: user.intentScore,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

module.exports = { updateProfile };
