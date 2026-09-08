import { AIAnalysis } from "../models/ai-analysis.model.js";
import { Ticket } from "../models/ticket.model.js";

export async function getDashboardOverview(req, res, next) {
  try {
    const organizationId = req.user.organizationId;
    const [ticketCounts, aiResolved, escalated, responseTime] = await Promise.all([
      Ticket.aggregate([
        { $match: { organizationId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Ticket.countDocuments({ organizationId, isAiResolved: true }),
      AIAnalysis.countDocuments({ organizationId, requiresHuman: true }),
      Ticket.aggregate([
        {
          $match: {
            organizationId,
            firstResponseAt: { $ne: null },
          },
        },
        {
          $project: {
            responseTimeMs: {
              $subtract: ["$firstResponseAt", "$createdAt"],
            },
          },
        },
        { $group: { _id: null, averageMs: { $avg: "$responseTimeMs" } } },
      ]),
    ]);

    const byStatus = Object.fromEntries(
      ticketCounts.map(({ _id, count }) => [_id, count])
    );

    return res.status(200).json({
      success: true,
      data: {
        tickets: {
          total: Object.values(byStatus).reduce((total, count) => total + count, 0),
          open: byStatus.open || 0,
          inProgress: byStatus.in_progress || 0,
          waitingForCustomer: byStatus.waiting_for_customer || 0,
          resolved: byStatus.resolved || 0,
          closed: byStatus.closed || 0,
        },
        aiResolved,
        escalated,
        averageFirstResponseTimeMs: Math.round(responseTime[0]?.averageMs || 0),
      },
    });
  } catch (error) {
    next(error);
  }
}
