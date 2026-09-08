import { Ticket } from "../models/ticket.model.js";
import { Message } from "../models/message.model.js";
import { AIAnalysis } from "../models/ai-analysis.model.js";
import { KnowledgeBaseArticle } from "../models/knowledge-base-article.model.js";
import { User } from "../models/user.model.js";

/*
|--------------------------------------------------------------------------
| AI SERVICE
|--------------------------------------------------------------------------
|
| This service contains the business logic for all AI operations.
|
| IMPORTANT:
| The actual LLM call should eventually live in a separate provider
| module/service, for example:
|
| services/ai-provider.service.js
|
| This keeps our application independent of a particular AI provider.
|
|--------------------------------------------------------------------------
*/


/**
 * Get all messages belonging to a ticket.
 */
const getTicketConversation = async (ticketId, organizationId) => {
  const messages = await Message.find({
    ticketId,
    organizationId,
    isInternal: false,
  })
    .sort({ sentAt: 1 })
    .lean();

  return messages;
};


/**
 * Get relevant knowledge base articles.
 *
 * This is a basic implementation using text matching.
 *
 * Later this should be replaced/enhanced with semantic/vector search.
 */
const searchKnowledgeBase = async ({
  organizationId,
  query,
  limit = 5,
}) => {
  if (!query) {
    return [];
  }

  const searchRegex = new RegExp(
    query
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .slice(0, 10)
      .join("|"),
    "i"
  );

  const articles = await KnowledgeBaseArticle.find({
    organizationId,
    status: "published",
    visibility: { $in: ["public", "ai_only"] },
    $or: [
      { title: searchRegex },
      { content: searchRegex },
      { category: searchRegex },
    ],
  })
    .sort({ helpfulCount: -1 })
    .limit(limit)
    .lean();

  return articles;
};


/**
 * Get the latest customer-facing ticket message.
 */
const getLatestCustomerMessage = async (ticketId, organizationId) => {
  return Message.findOne({
    ticketId,
    organizationId,
    senderType: "customer",
    isInternal: false,
  })
    .sort({ sentAt: -1 })
    .lean();
};


/**
 * Build the context that will eventually be sent to the LLM.
 */
const buildTicketContext = async ({
  ticket,
  organizationId,
}) => {
  const messages = await getTicketConversation(
    ticket._id,
    organizationId
  );

  const latestCustomerMessage = await getLatestCustomerMessage(
    ticket._id,
    organizationId
  );

  const knowledgeBaseArticles = await searchKnowledgeBase({
    organizationId,
    query: `${ticket.subject} ${
      latestCustomerMessage?.bodyText || ""
    }`,
    limit: 5,
  });

  return {
    ticket: {
      id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      source: ticket.source,
    },

    customer: ticket.customerId
      ? {
          id: ticket.customerId._id,
          name: ticket.customerId.name,
          email: ticket.customerId.email,
        }
      : null,

    conversation: messages.map((message) => ({
      senderType: message.senderType,
      senderName: message.senderName,
      body: message.bodyText,
      direction: message.direction,
      sentAt: message.sentAt,
    })),

    knowledgeBaseArticles: knowledgeBaseArticles.map((article) => ({
      id: article._id,
      title: article.title,
      content: article.content,
      category: article.category,
    })),
  };
};


/**
 * Call the configured AI provider.
 *
 * This function is intentionally isolated.
 *
 * Replace the implementation with OpenAI, Gemini, Claude,
 * OpenRouter, or another provider later.
 */
const callAI = async ({
  systemPrompt,
  userPrompt,
}) => {
  /*
   * TODO:
   *
   * Connect this function to your chosen AI provider.
   *
   * Example:
   *
   * const response = await openai.chat.completions.create(...)
   *
   * or:
   *
   * const response = await gemini.generateContent(...)
   *
   * or an OpenRouter API call.
   */

  throw new Error(
    "AI provider is not configured. Implement callAI() before using AI features."
  );
};


/**
 * Safely parse JSON returned by an AI model.
 */
const parseAIJson = (response) => {
  if (!response) {
    throw new Error("AI returned an empty response");
  }

  if (typeof response === "object") {
    return response;
  }

  let cleanedResponse = response.trim();

  /*
   * Remove markdown code fences if the model returns:
   *
   * ```json
   * {...}
   * ```
   */
  cleanedResponse = cleanedResponse
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleanedResponse);
  } catch (error) {
    throw new Error(
      "AI returned an invalid JSON response"
    );
  }
};


/**
 * Analyze a ticket using AI.
 *
 * Responsibilities:
 * - Understand customer intent
 * - Categorize ticket
 * - Determine priority
 * - Determine whether AI can resolve it
 * - Determine confidence
 * - Determine whether human intervention is required
 * - Find relevant knowledge base articles
 */
const analyzeTicket = async ({
  ticket,
  organizationId,
}) => {
  const startTime = Date.now();

  const context = await buildTicketContext({
    ticket,
    organizationId,
  });

  const systemPrompt = `
You are the AI ticket classification and triage engine
for a customer support platform.

Analyze the support ticket carefully.

Your job is to determine:

1. The customer's intent.
2. The appropriate ticket category.
3. Ticket priority.
4. Whether the knowledge base contains enough information
   to answer the customer.
5. Whether AI can safely resolve the ticket.
6. Your confidence level.
7. Whether a human agent is required.
8. Why escalation is required when applicable.
9. A concise summary.
10. The recommended next action.

IMPORTANT:

- Never invent information.
- Never assume information that isn't provided.
- If the knowledge base does not contain enough information,
  recommend human escalation.
- Refunds, account security, legal issues, sensitive complaints,
  and situations requiring human judgment should normally be escalated.
- A high confidence score is required before automatic resolution.

Return ONLY valid JSON.

Expected format:

{
  "intent": "string",
  "category": "string",
  "categoryConfidence": 0,
  "priority": "low | medium | high | urgent",
  "priorityConfidence": 0,
  "canResolve": false,
  "resolutionConfidence": 0,
  "requiresHuman": true,
  "escalationReason": "string or null",
  "summary": "string",
  "suggestedAction": "string"
}
`;

  const userPrompt = `
Analyze the following support ticket.

${JSON.stringify(context, null, 2)}
`;

  const rawResponse = await callAI({
    systemPrompt,
    userPrompt,
  });

  const result = parseAIJson(rawResponse);

  /*
   * Normalize confidence values.
   */
  const categoryConfidence = Math.max(
    0,
    Math.min(1, Number(result.categoryConfidence) || 0)
  );

  const priorityConfidence = Math.max(
    0,
    Math.min(1, Number(result.priorityConfidence) || 0)
  );

  const resolutionConfidence = Math.max(
    0,
    Math.min(1, Number(result.resolutionConfidence) || 0)
  );

  const canResolve =
    Boolean(result.canResolve) &&
    resolutionConfidence >= 0.9 &&
    !result.requiresHuman;

  /*
   * Save AI analysis.
   */
  const analysis = await AIAnalysis.create({
    ticketId: ticket._id,
    organizationId,

    categoryId: null,

    categoryConfidence,

    intent: result.intent,

    priority: result.priority,

    priorityConfidence,

    canResolve,

    resolutionConfidence,

    requiresHuman:
      Boolean(result.requiresHuman) || !canResolve,

    escalationReason:
      result.escalationReason || null,

    summary: result.summary,

    suggestedAction:
      result.suggestedAction,

    knowledgeBaseArticles:
      context.knowledgeBaseArticles.map((article) => ({
        articleId: article.id,
        relevanceScore: 0,
      })),

    model: result.model || "unknown",

    processingTimeMs: Date.now() - startTime,
  });

  return analysis;
};


/**
 * Generate a personalized customer response.
 */
const generateResponse = async ({
  ticket,
  organizationId,
}) => {
  const context = await buildTicketContext({
    ticket,
    organizationId,
  });

  const systemPrompt = `
You are an expert customer support representative.

Write a personalized response to the customer.

Rules:

- Be helpful and human.
- Do not sound like a chatbot.
- Do not use generic canned language.
- Use the customer's name when available.
- Answer using ONLY information supported by the
  knowledge base and ticket context.
- Never invent policies, prices, dates, refunds, or guarantees.
- If the available information is insufficient, say so.
- Keep the response concise but useful.
- Do not mention that you are an AI.
- Do not mention internal systems or AI analysis.
- Do not use markdown unless appropriate for the email.
`;

  const userPrompt = `
Generate a customer support response.

Ticket context:

${JSON.stringify(context, null, 2)}

Return only the response that should be sent to the customer.
`;

  const response = await callAI({
    systemPrompt,
    userPrompt,
  });

  return {
    response:
      typeof response === "string"
        ? response.trim()
        : response,
  };
};


/**
 * Improve an agent's draft response.
 */
const improveResponse = async ({
  ticket,
  draftResponse,
  tone,
  instructions,
  organizationId,
}) => {
  const context = await buildTicketContext({
    ticket,
    organizationId,
  });

  const systemPrompt = `
You are an expert customer support writing assistant.

Improve the support agent's draft response.

Goals:

- Preserve the meaning and factual accuracy.
- Make it clearer.
- Make it more professional.
- Make it empathetic.
- Remove unnecessary repetition.
- Do not invent information.
- Do not change policies or commitments.
- Do not make promises that aren't in the original response
  or supported by the ticket context.
- Do not mention that AI was used.

Preferred tone:
${tone || "professional, friendly and helpful"}

Additional instructions:
${instructions || "None"}
`;

  const userPrompt = `
Ticket context:

${JSON.stringify(context, null, 2)}

Agent draft:

${draftResponse}

Return only the improved response.
`;

  const response = await callAI({
    systemPrompt,
    userPrompt,
  });

  return {
    originalResponse: draftResponse,
    improvedResponse:
      typeof response === "string"
        ? response.trim()
        : response,
  };
};


/**
 * Suggest a reply for a support agent.
 */
const suggestReply = async ({
  ticket,
  organizationId,
}) => {
  const generated = await generateResponse({
    ticket,
    organizationId,
  });

  return {
    suggestion: generated.response,
  };
};


/**
 * Summarize a ticket.
 */
const summarizeTicket = async ({
  ticket,
  organizationId,
}) => {
  const context = await buildTicketContext({
    ticket,
    organizationId,
  });

  const systemPrompt = `
You are a customer support ticket summarization assistant.

Create a concise summary that allows a support agent
to understand the issue quickly.

Include:

- Customer's main issue
- Important context
- What has already been attempted
- Current situation
- Recommended next step

Do not invent information.
Return ONLY valid JSON.

Format:

{
  "summary": "string",
  "customerIssue": "string",
  "importantContext": "string",
  "actionsTaken": "string",
  "currentSituation": "string",
  "recommendedNextStep": "string"
}
`;

  const userPrompt = `
Summarize this ticket:

${JSON.stringify(context, null, 2)}
`;

  const rawResponse = await callAI({
    systemPrompt,
    userPrompt,
  });

  return parseAIJson(rawResponse);
};


/**
 * Find a knowledge base answer for a ticket.
 */
const findKnowledgeBaseAnswer = async ({
  ticket,
  organizationId,
}) => {
  const latestCustomerMessage =
    await getLatestCustomerMessage(
      ticket._id,
      organizationId
    );

  const query = `
    ${ticket.subject || ""}
    ${latestCustomerMessage?.bodyText || ""}
  `;

  const articles = await searchKnowledgeBase({
    organizationId,
    query,
    limit: 5,
  });

  if (!articles.length) {
    return {
      found: false,
      answer: null,
      articles: [],
      confidence: 0,
    };
  }

  const systemPrompt = `
You are a knowledge base retrieval assistant.

Determine whether the supplied knowledge base articles
contain enough information to answer the customer's question.

Rules:

- Do not invent information.
- Only use information from the provided articles.
- If the articles don't adequately answer the question,
  return found=false.
- Give a confidence score between 0 and 1.

Return ONLY valid JSON:

{
  "found": true,
  "answer": "string",
  "confidence": 0
}
`;

  const userPrompt = `
Customer question:

${latestCustomerMessage?.bodyText || ticket.subject}

Knowledge base articles:

${JSON.stringify(articles, null, 2)}
`;

  const rawResponse = await callAI({
    systemPrompt,
    userPrompt,
  });

  const result = parseAIJson(rawResponse);

  return {
    found: Boolean(result.found),
    answer: result.answer || null,
    confidence: Math.max(
      0,
      Math.min(1, Number(result.confidence) || 0)
    ),
    articles: articles.map((article) => ({
      id: article._id,
      title: article.title,
    })),
  };
};


/**
 * Resolve a ticket using AI.
 *
 * This is the main automated resolution workflow.
 */
const resolveTicketWithAI = async ({
  ticket,
  organizationId,
}) => {
  /*
   * Step 1:
   * Analyze the ticket.
   */
  const analysis = await analyzeTicket({
    ticket,
    organizationId,
  });

  /*
   * Step 2:
   * Don't automatically resolve if AI isn't confident.
   */
  if (
    !analysis.canResolve ||
    analysis.requiresHuman
  ) {
    return {
      resolved: false,
      requiresHuman: true,
      analysis,
      reason:
        analysis.escalationReason ||
        "AI does not have sufficient confidence to resolve this ticket.",
    };
  }

  /*
   * Step 3:
   * Generate the response.
   */
  const generatedResponse = await generateResponse({
    ticket,
    organizationId,
  });

  /*
   * Step 4:
   * Save generated response to the AI analysis.
   */
  analysis.generatedResponse =
    generatedResponse.response;

  analysis.responseApproved = true;

  await analysis.save();

  /*
   * Step 5:
   * Mark ticket as AI resolved.
   *
   * NOTE:
   * The actual email sending should happen through
   * email.service.js / background job.
   */
  ticket.status = "resolved";
  ticket.resolutionType = "ai_resolved";
  ticket.isAiResolved = true;
  ticket.resolvedAt = new Date();

  await ticket.save();

  return {
    resolved: true,
    requiresHuman: false,
    response: generatedResponse.response,
    analysis,
    ticket,
  };
};


/**
 * Escalate a ticket to a human agent.
 */
const escalateTicket = async ({
  ticket,
  reason,
  organizationId,
}) => {
  const escalationReason =
    reason ||
    "Ticket requires human assistance.";

  /*
   * Find an active agent in the organization.
   */
  const agent = await User.findOne({
    organizationId,
    role: "agent",
    isActive: true,
  }).sort({
    lastSeenAt: -1,
  });

  /*
   * Update ticket.
   */
  ticket.status = "open";
  ticket.isAiResolved = false;
  ticket.resolutionType = null;

  if (agent) {
    ticket.assignedTo = agent._id;
  }

  await ticket.save();

  /*
   * Update latest AI analysis if available.
   */
  const analysis = await AIAnalysis.findOne({
    ticketId: ticket._id,
    organizationId,
  }).sort({
    createdAt: -1,
  });

  if (analysis) {
    analysis.requiresHuman = true;
    analysis.canResolve = false;
    analysis.escalationReason = escalationReason;

    await analysis.save();
  }

  return {
    ticket,
    assignedAgent: agent
      ? {
          id: agent._id,
          name: agent.name,
          email: agent.email,
        }
      : null,
    reason: escalationReason,
  };
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

  // Exported mainly for future services/tests.
  searchKnowledgeBase,
  buildTicketContext,
};
