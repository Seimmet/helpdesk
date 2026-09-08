import { Attachment } from "../models/attachment.model.js";
import { Ticket } from "../models/ticket.model.js";

export async function createAttachment(req, res) {
  try {
    const {
      fileName,
      fileUrl,
      mimeType,
      fileSize,
      messageId,
    } = req.body;

    const { ticketId } = req.params;

    if (!fileName || !fileUrl || !mimeType) {
      return res.status(400).json({
        error: "File name, URL, and MIME type are required",
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

    const attachment = await Attachment.create({
      organizationId: req.user.organizationId,
      ticketId,
      messageId,
      fileName,
      fileUrl,
      mimeType,
      fileSize: fileSize || 0,
    });

    res.status(201).json({
      message: "Attachment created successfully",
      attachment,
    });
  } catch (error) {
    console.error(
      "Error in createAttachment controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getTicketAttachments(req, res) {
  try {
    const { ticketId } = req.params;

    const attachments = await Attachment.find({
      ticketId,
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      attachments,
    });
  } catch (error) {
    console.error(
      "Error in getTicketAttachments controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function deleteAttachment(req, res) {
  try {
    const { id: attachmentId } = req.params;

    const attachment = await Attachment.findOne({
      _id: attachmentId,
      organizationId: req.user.organizationId,
    });

    if (!attachment) {
      return res.status(404).json({
        error: "Attachment not found",
      });
    }

    await attachment.deleteOne();

    res.status(200).json({
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error in deleteAttachment controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}