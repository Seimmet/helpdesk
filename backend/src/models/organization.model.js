import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    logoUrl: {
      type: String,
      default: "",
    },

    websiteUrl: {
      type: String,
      default: "",
    },

    supportEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    timezone: {
      type: String,
      default: "Africa/Lagos",
    },

    settings: {
      autoResolveTickets: {
        type: Boolean,
        default: true,
      },

      autoResolveConfidenceThreshold: {
        type: Number,
        default: 0.9,
        min: 0,
        max: 1,
      },

      requireHumanApprovalForRefunds: {
        type: Boolean,
        default: true,
      },

      requireHumanApprovalForSensitiveIssues: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model(
  "Organization",
  organizationSchema
);