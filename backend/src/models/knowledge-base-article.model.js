import mongoose from "mongoose";

const knowledgeBaseArticleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    content: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    visibility: {
      type: String,
      enum: ["internal", "public", "ai_only"],
      default: "internal",
    },

    source: {
      type: String,
      enum: ["manual", "imported", "ai_generated"],
      default: "manual",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    helpfulCount: {
      type: Number,
      default: 0,
    },

    notHelpfulCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

knowledgeBaseArticleSchema.index({
  organizationId: 1,
  status: 1,
});

knowledgeBaseArticleSchema.index(
  { organizationId: 1, slug: 1 },
  { unique: true }
);

export const KnowledgeBaseArticle = mongoose.model(
  "KnowledgeBaseArticle",
  knowledgeBaseArticleSchema
);