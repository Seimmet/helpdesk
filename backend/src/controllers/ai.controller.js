import { Ticket } from "../models/ticket.model.js";
import { AIAnalysis } from "../models/ai-analysis.model.js";
import * as aiService from "../services/ai.service.js";

/**
 * Analyze a ticket using AI
 * POST /api/ai/analyze-ticket/:ticketId
 */
const analyzeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const organizationId = req.user.organizationId;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const analysis = await aiService.analyzeTicket({
      ticket,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Ticket analyzed successfully",
      data: analysis,
    });
  } catch (error) {
    console.error("Analyze ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to analyze ticket",
      error: error.message,
    });
  }
};

/**
 * Generate an AI response for a ticket
 * POST /api/ai/generate-response/:ticketId
 */
const generateResponse = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const organizationId = req.user.organizationId;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    }).populate("customerId");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const response = await aiService.generateResponse({
      ticket,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "AI response generated successfully",
      data: response,
    });
  } catch (error) {
    console.error("Generate AI response error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI response",
      error: error.message,
    });
  }
};

/**
 * Improve an agent's draft response
 * POST /api/ai/improve-response/:ticketId
 */
const improveResponse = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { draftResponse, tone, instructions } = req.body;
    const organizationId = req.user.organizationId;

    if (!draftResponse) {
      return res.status(400).json({
        success: false,
        message: "Draft response is required",
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const improvedResponse = await aiService.improveResponse({
      ticket,
      draftResponse,
      tone,
      instructions,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Response improved successfully",
      data: improvedResponse,
    });
  } catch (error) {
    console.error("Improve response error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to improve response",
      error: error.message,
    });
  }
};

/**
 * Suggest a reply to the agent
 * POST /api/ai/suggest-reply/:ticketId
 */
const suggestReply = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const organizationId = req.user.organizationId;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    }).populate("customerId");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const suggestion = await aiService.suggestReply({
      ticket,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Reply suggestion generated successfully",
      data: suggestion,
    });
  } catch (error) {
    console.error("Suggest reply error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate reply suggestion",
      error: error.message,
    });
  }
};

/**
 * Summarize a ticket
 * POST /api/ai/summarize-ticket/:ticketId
 */
const summarizeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const organizationId = req.user.organizationId;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const summary = await aiService.summarizeTicket({
      ticket,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Ticket summarized successfully",
      data: summary,
    });
  } catch (error) {
    console.error("Summarize ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to summarize ticket",
      error: error.message,
    });
  }
};

/**
 * Search the knowledge base for an answer
 * POST /api/ai/knowledge-base-answer/:ticketId
 */
const findKnowledgeBaseAnswer = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const organizationId = req.user.organizationId;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const result = await aiService.findKnowledgeBaseAnswer({
      ticket,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Knowledge base search completed",
      data: result,
    });
  } catch (error) {
    console.error("Knowledge base answer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search knowledge base",
      error: error.message,
    });
  }
};

/**
 * Resolve a ticket automatically using AI
 * POST /api/ai/resolve-ticket/:ticketId
 */
const resolveTicketWithAI = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const organizationId = req.user.organizationId;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    }).populate("customerId");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const result = await aiService.resolveTicketWithAI({
      ticket,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Ticket processed by AI",
      data: result,
    });
  } catch (error) {
    console.error("AI ticket resolution error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resolve ticket with AI",
      error: error.message,
    });
  }
};

/**
 * Escalate a ticket to a human agent
 * POST /api/ai/escalate-ticket/:ticketId
 */
const escalateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reason } = req.body;
    const organizationId = req.user.organizationId;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const result = await aiService.escalateTicket({
      ticket,
      reason,
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Ticket escalated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Escalate ticket error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to escalate ticket",
      error: error.message,
    });
  }
};

export {
  analyzeTicket,
  generateResponse,
  improveResponse,
  suggestReply,
  summarizeTicket,
  findKnowledgeBaseAnswer,
  resolveTicketWithAI,
  escalateTicket,
};
