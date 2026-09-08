// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     organizationId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Organization",
//       required: true,
//       index: true,
//     },

//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       lowercase: true,
//       trim: true,
//     },

//     password: {
//       type: String,
//       select: false,
//     },

//     imageUrl: {
//       type: String,
//       default: "",
//     },

//     role: {
//       type: String,
//       enum: ["owner", "admin", "agent"],
//       default: "agent",
//     },

//     isActive: {
//       type: Boolean,
//       default: true,
//     },

//     lastSeenAt: {
//       type: Date,
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// userSchema.index(
//   { organizationId: 1, email: 1 },
//   { unique: true }
// );

// export const User = mongoose.model("User", userSchema);

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    imageUrl: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["owner", "admin", "agent"],
      default: "agent",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);

  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Compare plain password with stored hash
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);

export default User;
