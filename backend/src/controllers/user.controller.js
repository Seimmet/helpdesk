import { User } from "../models/user.model.js";

export async function createUser(req, res) {
  try {
    const {
      name,
      email,
      password,
      imageUrl,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: "Name and email are required",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    const organizationId = req.user.organizationId;

    const existingUser = await User.findOne({
      organizationId,
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email already exists",
      });
    }

    const user = await User.create({
      organizationId,
      name,
      email: email.toLowerCase(),
      password,
      imageUrl,
      role: "agent",
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in createUser controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await User.find({
      organizationId: req.user.organizationId,
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Error in getUsers controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getUser(req, res) {
  try {
    const { id: userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      organizationId: req.user.organizationId,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Error in getUser controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateUser(req, res) {
  try {
    const { id: userId } = req.params;

    const {
      name,
      email,
      imageUrl,
      role,
      isActive,
    } = req.body;

    const user = await User.findOne({
      _id: userId,
      organizationId: req.user.organizationId,
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    user.name = name || user.name;
    user.email = email
      ? email.toLowerCase()
      : user.email;

    user.imageUrl =
      imageUrl !== undefined
        ? imageUrl
        : user.imageUrl;

    if (role && role !== user.role) {
      if (user.role === "owner") {
        return res.status(403).json({
          error: "The organization owner role cannot be changed",
        });
      }

      // Owners may manage admin/agent roles. Admins may manage agents only.
      if (req.user.role === "admin" && role !== "agent") {
        return res.status(403).json({
          error: "Admins can only assign the agent role",
        });
      }

      if (req.user.role !== "owner" && role !== "agent") {
        return res.status(403).json({
          error: "You do not have permission to assign this role",
        });
      }

      if (user.role === "owner" && req.user.id.toString() !== user._id.toString()) {
        return res.status(403).json({
          error: "The organization owner cannot be modified by another user",
        });
      }

      user.role = role;
    }

    if (isActive !== undefined) {
      if (user.role === "owner" && !isActive) {
        return res.status(403).json({
          error: "The organization owner cannot be deactivated",
        });
      }
      user.isActive = isActive;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      message: "User updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in updateUser controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id: userId } = req.params;

    const user = await User.findOne({
      _id: userId,
      organizationId: req.user.organizationId,
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.role === "owner") {
      return res.status(403).json({
        error: "The organization owner cannot be deactivated",
      });
    }

    user.isActive = false;

    await user.save();

    res.status(200).json({
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error in deleteUser controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}