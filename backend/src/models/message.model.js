import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
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

    senderType: {
      type: String,
      enum: ["customer", "agent", "ai", "system"],
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    senderName: {
      type: String,
      default: "",
    },

    senderEmail: {
      type: String,
      default: "",
    },

    to: [
      {
        type: String,
      },
    ],

    cc: [
      {
        type: String,
      },
    ],

    bcc: [
      {
        type: String,
      },
    ],

    subject: {
      type: String,
      default: "",
    },

    bodyText: {
      type: String,
      default: "",
    },

    bodyHtml: {
      type: String,
      default: "",
    },

    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },

    channel: {
      type: String,
      enum: ["email", "web", "chat", "phone", "whatsapp"],
      default: "email",
    },

    externalMessageId: {
      type: String,
      default: "",
    },

    isInternal: {
      type: Boolean,
      default: false,
    },

    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

messageSchema.index({
  ticketId: 1,
  createdAt: 1,
});

messageSchema.index(
  { organizationId: 1, externalMessageId: 1 },
  { unique: true, sparse: true }
);

export const Message = mongoose.model(
  "Message",
  messageSchema
);