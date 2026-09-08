import mongoose from "mongoose";

const emailIntegrationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: [
        "gmail",
        "outlook",
        "imap",
        "smtp",
        "resend",
        "sendgrid",
        "mailgun",
      ],
      required: true,
    },

    emailAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    displayName: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    credentials: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const EmailIntegration = mongoose.model(
  "EmailIntegration",
  emailIntegrationSchema
);