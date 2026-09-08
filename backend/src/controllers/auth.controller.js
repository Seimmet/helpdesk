import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { Organization } from "../models/organization.model.js";
import { ENV } from "../config/env.js";

const generateToken = (userId) => {
  if (!ENV.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: userId.toString(),
    },
    ENV.JWT_SECRET,
    {
      expiresIn: ENV.JWT_EXPIRES_IN || "7d",
    }
  );
};

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === "production",
    sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const getSafeUser = (user) => ({
  id: user._id,
  organizationId: user.organizationId,
  name: user.name,
  email: user.email,
  role: user.role,
  imageUrl: user.imageUrl,
  isActive: user.isActive,
  lastSeenAt: user.lastSeenAt,
  createdAt: user.createdAt,
});

const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Register a new organization and its owner.
 *
 * This is the ONLY public registration endpoint.
 */
export const register = async (req, res, next) => {
  let organization;

  try {
    const {
      organizationName,
      name,
      email,
      password,
      websiteUrl,
      supportEmail,
      timezone,
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Generate organization slug
    let slug = createSlug(organizationName);

    if (!slug) {
      slug = `organization-${Date.now()}`;
    }

    // Make slug unique
    const existingOrganization = await Organization.findOne({ slug });

    if (existingOrganization) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create organization
    organization = await Organization.create({
      name: organizationName,
      slug,
      websiteUrl: websiteUrl || null,
      supportEmail: supportEmail || normalizedEmail,
      timezone: timezone || "Africa/Lagos",
    });

    // Create organization owner
    const owner = await User.create({
      organizationId: organization._id,
      name,
      email: normalizedEmail,
      password,
      role: "owner",
      isActive: true,
    });

    // Generate JWT
    const token = generateToken(owner._id);

    // Set HTTP-only cookie
    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Organization registered successfully",
      data: {
        user: getSafeUser(owner),
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
          websiteUrl: organization.websiteUrl,
          supportEmail: organization.supportEmail,
          timezone: organization.timezone,
        },
        token,
      },
    });
  } catch (error) {
    // Clean up organization if owner creation fails
    if (organization?._id) {
      try {
        await Organization.findByIdAndDelete(organization._id);
      } catch (cleanupError) {
        console.error(
          "Organization cleanup failed:",
          cleanupError
        );
      }
    }

    next(error);
  }
};

/**
 * Login with email and password.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    const passwordIsValid = await user.comparePassword(password);

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last seen
    user.lastSeenAt = new Date();
    await user.save();

    const token = generateToken(user._id);

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: getSafeUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently authenticated user.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: getSafeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout.
 */
export const logout = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change authenticated user's password.
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentPasswordIsValid =
      await user.comparePassword(currentPassword);

    if (!currentPasswordIsValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;

    await user.save();

    // Issue a new token after password change
    const token = generateToken(user._id);

    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: {
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};
