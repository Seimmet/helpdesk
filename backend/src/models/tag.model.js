import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
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
      lowercase: true,
    },

    color: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

tagSchema.index(
  { organizationId: 1, name: 1 },
  { unique: true }
);

export const Tag = mongoose.model("Tag", tagSchema);