import mongoose from "mongoose";

const ticketCategorySchema = new mongoose.Schema(
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

    description: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ticketCategorySchema.index(
  { organizationId: 1, name: 1 },
  { unique: true }
);

export const TicketCategory = mongoose.model(
  "TicketCategory",
  ticketCategorySchema
);