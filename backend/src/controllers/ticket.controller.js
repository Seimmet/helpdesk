import { Ticket } from "../models/ticket.model.js";
import { Customer } from "../models/customer.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

export async function createTicket(req, res) {
  try {
    const {
      customerId,
      subject,
      categoryId,
      priority,
      source,
      tags,
    } = req.body;

    if (!customerId || !subject) {
      return res.status(400).json({
        error: "Customer and subject are required",
      });
    }

    const organizationId = req.user.organizationId;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId,
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    const lastTicket = await Ticket.findOne({
      organizationId,
    }).sort({ ticketNumber: -1 });

    const ticketNumber = lastTicket
      ? lastTicket.ticketNumber + 1
      : 1001;

    const ticket = await Ticket.create({
      organizationId,
      ticketNumber,
      customerId,
      subject,
      categoryId,
      priority: priority || "medium",
      source: source || "email",
      tags: tags || [],
    });

    customer.totalTickets += 1;
    customer.lastContactAt = new Date();

    await customer.save();

    // Store the initial ticket description as the customer's first message.
    // This keeps the conversation history consistent with tickets received by email.
    if (req.body.description) {
      await Message.create({
        ticketId: ticket._id,
        organizationId,
        senderType: "customer",
        senderId: customer._id,
        senderName: customer.name,
        senderEmail: customer.email,
        subject,
        bodyText: req.body.description,
        direction: "inbound",
        channel: source || "web",
        isInternal: false,
        sentAt: ticket.createdAt,
      });

      ticket.lastMessageAt = ticket.createdAt;
      await ticket.save();
    }

    const populatedTicket = await Ticket.findById(
      ticket._id
    )
      .populate("customerId")
      .populate("assignedTo")
      .populate("categoryId")
      .populate("tags");

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("Error in createTicket controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getTickets(req, res) {
  try {
    const {
      status,
      priority,
      assignedTo,
      categoryId,
      isAiResolved,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      organizationId: req.user.organizationId,
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (categoryId) query.categoryId = categoryId;

    if (isAiResolved !== undefined) {
      query.isAiResolved = isAiResolved === "true";
    }

    if (search) {
      query.$or = [
        {
          subject: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const tickets = await Ticket.find(query)
      .populate("customerId")
      .populate("assignedTo", "name email imageUrl")
      .populate("categoryId")
      .populate("tags")
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Ticket.countDocuments(query);

    res.status(200).json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getTickets controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getTicket(req, res) {
  try {
    const { id: ticketId } = req.params;

    const ticket = await Ticket.findOne({
        _id: ticketId,
      organizationId: req.user.organizationId,
    })
      .populate("customerId")
      .populate("assignedTo", "name email imageUrl")
      .populate("categoryId")
      .populate("tags");

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    res.status(200).json({
      ticket,
    });
  } catch (error) {
    console.error("Error in getTicket controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function updateTicket(req, res) {
  try {
    const { id: ticketId } = req.params;

    const {
      subject,
      categoryId,
      priority,
      status,
      tags,
      assignedTo,
    } = req.body;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId: req.user.organizationId,
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    ticket.subject = subject || ticket.subject;
    ticket.categoryId =
      categoryId !== undefined
        ? categoryId
        : ticket.categoryId;

    ticket.priority = priority || ticket.priority;
    ticket.status = status || ticket.status;

    ticket.tags =
      tags !== undefined ? tags : ticket.tags;

    ticket.assignedTo =
      assignedTo !== undefined
        ? assignedTo
        : ticket.assignedTo;

    if (status === "resolved" && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
      ticket.resolutionType =
        ticket.isAiResolved
          ? "ai_resolved"
          : "agent_resolved";
    }

    if (status === "closed" && !ticket.closedAt) {
      ticket.closedAt = new Date();
    }

    await ticket.save();

    res.status(200).json({
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Error in updateTicket controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function assignTicket(req, res) {
  try {
    const { id: ticketId } = req.params;
    const { assignedTo } = req.body;

    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo,
        organizationId: req.user.organizationId,
        isActive: true,
      });

      if (!assignedUser) {
        return res.status(400).json({
          error: "Assigned user must be an active member of this organization",
        });
      }
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

    ticket.assignedTo = assignedTo || null;

    if (assignedTo && ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("assignedTo", "name email imageUrl");

    res.status(200).json({
      message: "Ticket assigned successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error("Error in assignTicket controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function changeTicketStatus(req, res) {
  try {
    const { id: ticketId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "open",
      "in_progress",
      "waiting_for_customer",
      "resolved",
      "closed",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid ticket status",
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

    ticket.status = status;

    if (status === "resolved") {
      ticket.resolvedAt = new Date();

      if (!ticket.resolutionType) {
        ticket.resolutionType = "agent_resolved";
      }
    }

    if (status === "closed") {
      ticket.closedAt = new Date();
    }

    await ticket.save();

    res.status(200).json({
      message: "Ticket status updated successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Error in changeTicketStatus controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function changeTicketPriority(req, res) {
  try {
    const { id: ticketId } = req.params;
    const { priority } = req.body;

    const validPriorities = [
      "low",
      "medium",
      "high",
      "urgent",
    ];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: "Invalid ticket priority",
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

    ticket.priority = priority;

    await ticket.save();

    res.status(200).json({
      message: "Ticket priority updated successfully",
      ticket,
    });
  } catch (error) {
    console.error(
      "Error in changeTicketPriority controller:",
      error
    );

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function deleteTicket(req, res) {
  try {
    const { id: ticketId } = req.params;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organizationId: req.user.organizationId,
    });

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket not found",
      });
    }

    await ticket.deleteOne();

    res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteTicket controller:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}