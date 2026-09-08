import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    ticketNumber: {
      type: Number,
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TicketCategory",
      default: null,
    },

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "open",
        "in_progress",
        "waiting_for_customer",
        "resolved",
        "closed",
      ],
      default: "open",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    source: {
      type: String,
      enum: [
        "email",
        "web",
        "chat",
        "api",
        "phone",
        "whatsapp",
      ],
      default: "email",
    },

    resolutionType: {
      type: String,
      enum: [
        "ai_resolved",
        "agent_resolved",
        "customer_resolved",
        "unresolved",
        null,
      ],
      default: null,
    },

    isAiResolved: {
      type: Boolean,
      default: false,
    },

    firstResponseAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

ticketSchema.index(
  { organizationId: 1, ticketNumber: 1 },
  { unique: true }
);

ticketSchema.index({
  organizationId: 1,
  status: 1,
  priority: 1,
});

export const Ticket = mongoose.model("Ticket", ticketSchema);