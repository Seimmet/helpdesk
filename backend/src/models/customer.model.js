import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
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
      lowercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      default: "",
    },

    avatarUrl: {
      type: String,
      default: "",
    },

    externalCustomerId: {
      type: String,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    lastContactAt: {
      type: Date,
      default: null,
    },

    totalTickets: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

customerSchema.index(
  { organizationId: 1, email: 1 },
  { unique: true }
);

export const Customer = mongoose.model(
  "Customer",
  customerSchema
);