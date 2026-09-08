import mongoose from "mongoose";

const automationRuleSchema = new mongoose.Schema(
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

    isActive: {
      type: Boolean,
      default: true,
    },

    trigger: {
      type: String,
      enum: [
        "ticket_created",
        "ticket_updated",
        "message_received",
        "ai_analysis_completed",
        "ticket_resolved",
      ],
      required: true,
    },

    conditions: [
      {
        field: {
          type: String,
          required: true,
        },

        operator: {
          type: String,
          enum: [
            "equals",
            "not_equals",
            "contains",
            "greater_than",
            "less_than",
          ],
          required: true,
        },

        value: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],

    actions: [
      {
        type: {
          type: String,
          enum: [
            "assign_agent",
            "assign_category",
            "add_tag",
            "remove_tag",
            "change_priority",
            "change_status",
            "send_ai_response",
            "send_notification",
          ],
          required: true,
        },

        value: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],
  },
  { timestamps: true }
);

export const AutomationRule = mongoose.model(
  "AutomationRule",
  automationRuleSchema
);