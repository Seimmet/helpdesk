import mongoose from "mongoose";

const aiAnalysisSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketCategory",
      default: null,
    },

    categoryConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    intent: {
      type: String,
      default: "",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    priorityConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    canResolve: {
      type: Boolean,
      default: false,
    },

    resolutionConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    requiresHuman: {
      type: Boolean,
      default: false,
    },

    escalationReason: {
      type: String,
      default: "",
    },

    summary: {
      type: String,
      default: "",
    },

    suggestedAction: {
      type: String,
      default: "",
    },

    knowledgeBaseArticles: [
      {
        articleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "KnowledgeBaseArticle",
        },

        relevanceScore: {
          type: Number,
          default: 0,
        },
      },
    ],

    generatedResponse: {
      type: String,
      default: "",
    },

    responseApproved: {
      type: Boolean,
      default: false,
    },

    model: {
      type: String,
      default: "",
    },

    tokensUsed: {
      type: Number,
      default: 0,
    },

    processingTimeMs: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const AIAnalysis = mongoose.model(
  "AIAnalysis",
  aiAnalysisSchema
);