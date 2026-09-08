import { Message } from "../models/message.model.js";
import { Ticket } from "../models/ticket.model.js";

export async function getTicketMessages(req, res) {
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

    const messages = await Message.find({
      ticketId,
      organizationId: req.user.organizationId,
    })
      .sort({ createdAt: 1 });

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error(
      "Error in getTicketMessages controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function createMessage(req, res) {
  try {
    const {
      bodyText,
      bodyHtml,
      direction,
      channel,
      subject,
      isInternal,
    } = req.body;

    const { ticketId } = req.params;

    if (!bodyText && !bodyHtml) {
      return res.status(400).json({
        error: "Message body is required",
      });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId: req.user.organizationId,
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    const message = await Message.create({
      ticketId,
      organizationId: req.user.organizationId,
      senderType: isInternal ? "agent" : "agent",
      senderId: req.user.id,
      senderName: req.user.name,
      senderEmail: req.user.email,
      subject: subject || ticket.subject,
      bodyText,
      bodyHtml,
      direction: direction || "outbound",
      channel: channel || "email",
      isInternal: isInternal || false,
      sentAt: new Date(),
    });

    ticket.lastMessageAt = new Date();

    if (!isInternal) {
      if (!ticket.firstResponseAt) {
        ticket.firstResponseAt = new Date();
      }

      ticket.status = "in_progress";
    }

    await ticket.save();

    res.status(201).json({
      message: "Message created successfully",
      data: message,
    });
  } catch (error) {
    console.error(
      "Error in createMessage controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}