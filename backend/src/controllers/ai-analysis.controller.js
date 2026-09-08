import { AIAnalysis } from "../models/ai-analysis.model.js";
import { Ticket } from "../models/ticket.model.js";

export async function getTicketAIAnalysis(req, res) {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId: req.user.organizationId,
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    const analysis = await AIAnalysis.findOne({
      ticketId,
      organizationId: req.user.organizationId,
    })
      .sort({ createdAt: -1 })
      .populate("categoryId")
      .populate(
        "knowledgeBaseArticles.articleId"
      );

    if (!analysis) {
      return res.status(404).json({
        error: "AI analysis not found",
      });
    }

    res.status(200).json({
      analysis,
    });
  } catch (error) {
    console.error(
      "Error in getTicketAIAnalysis controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getAIAnalyses(req, res) {
  try {
    const {
      requiresHuman,
      canResolve,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      organizationId: req.user.organizationId,
    };

    if (requiresHuman !== undefined) {
      query.requiresHuman =
        requiresHuman === "true";
    }

    if (canResolve !== undefined) {
      query.canResolve =
        canResolve === "true";
    }

    const skip = (page - 1) * limit;

    const analyses = await AIAnalysis.find(query)
      .populate("ticketId")
      .populate("categoryId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AIAnalysis.countDocuments(query);

    res.status(200).json({
      analyses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "Error in getAIAnalyses controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function approveAIResponse(req, res) {
  try {
    const { id: analysisId } = req.params;

    const analysis = await AIAnalysis.findOne({
      _id: analysisId,
      organizationId: req.user.organizationId,
    });

    if (!analysis) {
      return res.status(404).json({
        error: "AI analysis not found",
      });
    }

    analysis.responseApproved = true;

    await analysis.save();

    res.status(200).json({
      message: "AI response approved successfully",
      analysis,
    });
  } catch (error) {
    console.error(
      "Error in approveAIResponse controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}