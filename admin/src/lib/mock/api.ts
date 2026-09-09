import { apiClient } from "@/lib/api-client";
import type { Role, TicketPriority, TicketStatus } from "./data";

export type TicketFilters = {
  search?: string;
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  category?: string | "all";
  assignee?: string | "all";
  sort?: "newest" | "oldest" | "priority";
  customerId?: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  title?: string;
  avatarColor?: string;
  imageUrl?: string | null;
  organizationId: string;
  isActive: boolean;
  lastSeenAt?: string | null;
  createdAt?: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  location: string;
  since: string;
  avatarColor?: string;
  phoneNumber?: string;
  ticketCount: number;
  openCount: number;
};

export type Agent = SessionUser & {
  assigned: number;
  open: number;
  resolved: number;
  csat: number | null;
};

export type Ticket = {
  id: string;
  reference: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  categoryId: string | null;
  customerId: string;
  assigneeId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  satisfaction: number | null;
  customer?: Customer;
  assignee?: SessionUser;
  messageCount: number;
};

export type Message = {
  id: string;
  ticketId: string;
  authorId: string | null;
  authorKind: "agent" | "customer" | "ai" | "system";
  body: string;
  createdAt: string;
  internal?: boolean;
  author?: { name: string; email?: string; imageUrl?: string | null };
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  authorId: string | null;
  author?: SessionUser;
  updatedAt: string;
  views: number;
  helpful: number;
};

const statusToApi: Record<TicketStatus, string> = {
  open: "open",
  pending: "waiting_for_customer",
  resolved: "resolved",
  closed: "closed",
};

const statusFromApi: Record<string, TicketStatus> = {
  open: "open",
  in_progress: "open",
  waiting_for_customer: "pending",
  resolved: "resolved",
  closed: "closed",
};

function idOf(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return null;
}

function safeName(value: any, fallback = "Unknown") {
  return value?.name || fallback;
}

function mapCustomer(raw: any, ticketCount = raw?.totalTickets ?? 0, openCount = 0): Customer {
  return {
    id: String(raw?._id ?? raw?.id),
    name: raw?.name ?? "Unknown",
    email: raw?.email ?? "",
    company: raw?.metadata?.company ?? raw?.metadata?.organization ?? "—",
    plan: raw?.metadata?.plan ?? "—",
    location: raw?.metadata?.location ?? "—",
    since: raw?.createdAt ?? new Date().toISOString(),
    avatarColor: undefined,
    phoneNumber: raw?.phoneNumber ?? "",
    ticketCount,
    openCount,
  };
}

function mapTicket(raw: any): Ticket {
  const customer = raw?.customerId;
  const assignee = raw?.assignedTo;
  const category = raw?.categoryId;
  const tags = Array.isArray(raw?.tags)
    ? raw.tags.map((tag: any) => (typeof tag === "string" ? tag : tag?.name)).filter(Boolean)
    : [];

  return {
    id: String(raw?._id ?? raw?.id),
    reference: `HD-${raw?.ticketNumber ?? ""}`,
    subject: raw?.subject ?? "Untitled ticket",
    description: raw?.description ?? "",
    status: statusFromApi[raw?.status] ?? "open",
    priority: raw?.priority ?? "medium",
    category: category?.name ?? "Uncategorized",
    categoryId: idOf(category),
    customerId: idOf(customer) ?? String(raw?.customerId ?? ""),
    assigneeId: idOf(assignee),
    tags,
    createdAt: raw?.createdAt ?? new Date().toISOString(),
    updatedAt: raw?.updatedAt ?? raw?.createdAt ?? new Date().toISOString(),
    dueAt: raw?.metadata?.dueAt ?? raw?.updatedAt ?? raw?.createdAt ?? new Date().toISOString(),
    satisfaction: raw?.metadata?.satisfaction ?? null,
    customer: customer ? mapCustomer(customer) : undefined,
    assignee: assignee
      ? {
          id: String(assignee._id),
          name: safeName(assignee),
          email: assignee.email ?? "",
          role: assignee.role ?? "agent",
          organizationId: String(assignee.organizationId ?? ""),
          isActive: assignee.isActive ?? true,
          imageUrl: assignee.imageUrl ?? null,
        }
      : undefined,
    messageCount: 0,
  };
}

function mapMessage(raw: any): Message {
  const authorKind = raw?.senderType === "customer" ? "customer" : raw?.senderType === "ai" ? "ai" : raw?.senderType === "system" ? "system" : "agent";
  return {
    id: String(raw?._id ?? raw?.id),
    ticketId: String(raw?.ticketId),
    authorId: raw?.senderId ? String(raw.senderId) : null,
    authorKind,
    body: raw?.bodyText || raw?.bodyHtml || "",
    createdAt: raw?.createdAt ?? raw?.sentAt ?? new Date().toISOString(),
    internal: Boolean(raw?.isInternal),
    author: {
      name: raw?.senderName || (authorKind === "ai" ? "AI Assistant" : "Unknown"),
      email: raw?.senderEmail,
      imageUrl: null,
    },
  };
}

export async function signIn(email: string, password: string) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  const user = data?.data?.user;
  const token = data?.data?.token;
  if (!user || !token) throw new Error("Login response was incomplete");
  if (typeof window !== "undefined") {
    localStorage.setItem("helpdesk.token", token);
    localStorage.setItem("helpdesk.session", JSON.stringify(user));
  }
  return normalizeUser(user);
}

export async function registerOrganization(input: {
  organizationName: string;
  name: string;
  email: string;
  password: string;
  websiteUrl?: string;
  supportEmail?: string;
  timezone?: string;
}) {
  const { data } = await apiClient.post("/auth/register", input);
  const user = data?.data?.user;
  const token = data?.data?.token;
  if (!user || !token) throw new Error("Registration response was incomplete");
  if (typeof window !== "undefined") {
    localStorage.setItem("helpdesk.token", token);
    localStorage.setItem("helpdesk.session", JSON.stringify(user));
  }
  return { user: normalizeUser(user), organization: data.data.organization };
}

export async function getCurrentUser() {
  const { data } = await apiClient.get("/auth/me");
  const user = data?.data?.user;
  if (!user) throw new Error("Current user was not returned");
  return normalizeUser(user);
}

export async function signOut() {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("helpdesk.token");
      localStorage.removeItem("helpdesk.session");
    }
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await apiClient.put("/auth/change-password", { currentPassword, newPassword });
  if (data?.data?.token && typeof window !== "undefined") {
    localStorage.setItem("helpdesk.token", data.data.token);
  }
  return data;
}

function normalizeUser(raw: any): SessionUser {
  return {
    id: String(raw._id ?? raw.id),
    name: raw.name,
    email: raw.email,
    role: raw.role,
    organizationId: String(raw.organizationId),
    imageUrl: raw.imageUrl ?? null,
    isActive: raw.isActive ?? true,
    lastSeenAt: raw.lastSeenAt ?? null,
    createdAt: raw.createdAt,
    title: raw.role === "owner" ? "Organization Owner" : raw.role === "admin" ? "Administrator" : "Support Agent",
    avatarColor: undefined,
  };
}

export async function listTickets(filters: TicketFilters = {}) {
  const params: Record<string, string | number> = { page: 1, limit: 100 };
  if (filters.search) params.search = filters.search;
  if (filters.priority && filters.priority !== "all") params.priority = filters.priority;
  if (filters.status && filters.status !== "all") params.status = statusToApi[filters.status];
  if (filters.assignee && filters.assignee !== "all" && filters.assignee !== "unassigned") params.assignedTo = filters.assignee;

  const { data } = await apiClient.get("/tickets", { params });
  let rows = (data?.tickets ?? []).map(mapTicket);

  if (filters.customerId) rows = rows.filter((t) => t.customerId === filters.customerId);
  if (filters.status && filters.status !== "all") rows = rows.filter((t) => t.status === filters.status);
  if (filters.category && filters.category !== "all") rows = rows.filter((t) => t.category === filters.category);
  if (filters.assignee === "unassigned") rows = rows.filter((t) => !t.assigneeId);

  const q = filters.search?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((t) => `${t.reference} ${t.subject} ${t.description} ${t.tags.join(" ")}`.toLowerCase().includes(q));
  }

  if (filters.sort === "oldest") rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  else if (filters.sort === "priority") {
    const rank: Record<TicketPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    rows.sort((a, b) => rank[a.priority] - rank[b.priority]);
  } else rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return rows;
}

export async function getTicket(id: string) {
  const [{ data: ticketData }, { data: messageData }] = await Promise.all([
    apiClient.get(`/tickets/${id}`),
    apiClient.get(`/messages/ticket/${id}`),
  ]);
  const ticket = mapTicket(ticketData?.ticket);
  const messages = (messageData?.messages ?? []).map(mapMessage);
  ticket.messageCount = messages.length;
  if (!ticket.description) ticket.description = messages.find((m) => m.authorKind === "customer")?.body ?? "";
  return { ticket, messages };
}

export async function createTicket(input: {
  subject: string;
  description: string;
  priority: TicketPriority;
  category: string;
  customerId: string;
  assigneeId: string | null;
  tags: string[];
}) {
  const [{ data: categoryData }, { data: tagData }] = await Promise.all([
    apiClient.get("/ticket-categories"),
    apiClient.get("/tags"),
  ]);

  const categoryId = (categoryData?.categories ?? []).find((c: any) => c.name === input.category)?._id;
  const knownTagIds = new Map((tagData?.tags ?? []).map((t: any) => [String(t.name).toLowerCase(), String(t._id)]));
  const tagIds = input.tags.map((name) => knownTagIds.get(name.toLowerCase())).filter(Boolean);

  const { data } = await apiClient.post("/tickets", {
    customerId: input.customerId,
    subject: input.subject,
    categoryId: categoryId || null,
    priority: input.priority,
    source: "web",
    tags: tagIds,
  });
  return mapTicket(data?.ticket);
}

export async function updateTicket(id: string, patch: Partial<Ticket>) {
  const payload: Record<string, unknown> = {};
  if (patch.subject !== undefined) payload.subject = patch.subject;
  if (patch.categoryId !== undefined) payload.categoryId = patch.categoryId;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.status !== undefined) payload.status = statusToApi[patch.status];
  if (patch.assigneeId !== undefined) payload.assignedTo = patch.assigneeId;
  if (patch.tags !== undefined) {
    const { data: tagData } = await apiClient.get("/tags");
    const ids = patch.tags.map((name) => (tagData?.tags ?? []).find((t: any) => t.name.toLowerCase() === name.toLowerCase())?._id).filter(Boolean);
    payload.tags = ids;
  }

  const { data } = await apiClient.put(`/tickets/${id}`, payload);
  return mapTicket(data?.ticket);
}

export async function deleteTicket(id: string) {
  await apiClient.delete(`/tickets/${id}`);
  return { id };
}

export async function addMessage(input: {
  ticketId: string;
  authorId: string;
  authorKind: "agent" | "customer";
  body: string;
  internal?: boolean;
}) {
  const { data } = await apiClient.post(`/messages/ticket/${input.ticketId}`, {
    bodyText: input.body,
    direction: "outbound",
    channel: "email",
    isInternal: input.internal ?? false,
  });
  return mapMessage(data?.data);
}

export async function listCustomers(search = "") {
  const { data } = await apiClient.get("/customers", { params: { search, page: 1, limit: 100 } });
  return (data?.customers ?? []).map((c: any) => mapCustomer(c));
}

export async function getCustomer(id: string) {
  const { data } = await apiClient.get(`/customers/${id}`);
  return mapCustomer(data?.customer);
}

export async function createCustomer(input: {
  name: string;
  email: string;
  phoneNumber?: string;
  company?: string;
}) {
  const { data } = await apiClient.post("/customers", {
    name: input.name,
    email: input.email,
    phoneNumber: input.phoneNumber || undefined,
    metadata: {
      company: input.company || undefined,
    },
  });
  return mapCustomer(data?.customer);
}

export async function listAgents(): Promise<Agent[]> {
  const [{ data: userData }, { data: ticketData }] = await Promise.all([
    apiClient.get("/users"),
    apiClient.get("/tickets", { params: { page: 1, limit: 1000 } }),
  ]);
  const users = (userData?.users ?? []).map(normalizeUser);
  const tickets = (ticketData?.tickets ?? []).map(mapTicket);
  return users.map((u) => {
    const own = tickets.filter((t) => t.assigneeId === u.id);
    return {
      ...u,
      assigned: own.length,
      open: own.filter((t) => t.status === "open").length,
      resolved: own.filter((t) => t.status === "resolved" || t.status === "closed").length,
      csat: null,
    };
  });
}

export async function listCategories() {
  const { data } = await apiClient.get("/ticket-categories");
  return (data?.categories ?? []).filter((c: any) => c.isActive !== false);
}

export async function listTags() {
  const { data } = await apiClient.get("/tags");
  return data?.tags ?? [];
}

export async function listArticles(search = "", category: string | "all" = "all") {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (category !== "all") params.category = category;
  const { data } = await apiClient.get("/knowledge-base", { params });
  return (data?.articles ?? []).map(mapArticle);
}

function mapArticle(raw: any): Article {
  return {
    id: String(raw?._id ?? raw?.id),
    slug: raw?.slug ?? "",
    title: raw?.title ?? "Untitled article",
    excerpt: (raw?.content ?? "").slice(0, 180),
    body: raw?.content ?? "",
    category: raw?.category ?? "General",
    authorId: raw?.createdBy?._id ? String(raw.createdBy._id) : null,
    author: raw?.createdBy ? normalizeUser({ ...raw.createdBy, role: "agent", organizationId: "", isActive: true }) : undefined,
    updatedAt: raw?.updatedAt ?? raw?.createdAt ?? new Date().toISOString(),
    views: raw?.viewCount ?? 0,
    helpful: raw?.helpfulCount ?? 0,
  };
}

export async function getArticle(slug: string) {
  const { data } = await apiClient.get("/knowledge-base", { params: { limit: 100 } });
  const raw = (data?.articles ?? []).find((a: any) => a.slug === slug);
  if (!raw) throw new Error("We couldn't find that article.");
  return { article: mapArticle(raw), author: raw.createdBy ? normalizeUser({ ...raw.createdBy, role: "agent", organizationId: "", isActive: true }) : undefined };
}

export async function markArticleHelpful(slug: string) {
  const { data } = await apiClient.get("/knowledge-base", { params: { limit: 100 } });
  const raw = (data?.articles ?? []).find((a: any) => a.slug === slug);
  if (!raw) throw new Error("We couldn't find that article.");
  const response = await apiClient.patch(`/knowledge-base/${raw._id}/helpful`);
  return mapArticle(response.data?.article);
}

export async function getDashboard() {
  const [{ data: overviewData }, { data: ticketData }, { data: userData }] = await Promise.all([
    apiClient.get("/dashboard/overview"),
    apiClient.get("/tickets", { params: { page: 1, limit: 1000 } }),
    apiClient.get("/users"),
  ]);

  const tickets = (ticketData?.tickets ?? []).map(mapTicket);
  const users = (userData?.users ?? []).map(normalizeUser);
  const overview = overviewData?.data ?? {};
  const counts = overview.tickets ?? {};

  const byStatus: Array<{ status: TicketStatus; count: number }> = [
    { status: "open", count: counts.open ?? 0 },
    { status: "pending", count: counts.waitingForCustomer ?? 0 },
    { status: "resolved", count: counts.resolved ?? 0 },
    { status: "closed", count: counts.closed ?? 0 },
  ];

  const byPriority = (["urgent", "high", "medium", "low"] as TicketPriority[]).map((priority) => ({
    priority,
    count: tickets.filter((t) => t.priority === priority).length,
  }));

  const recent = tickets.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const activity = recent.map((ticket, index) => ({
    id: `${ticket.id}-${index}`,
    who: ticket.assigneeId,
    what: `was assigned ${ticket.reference}`,
    when: ticket.updatedAt,
    user: users.find((u) => u.id === ticket.assigneeId),
  }));

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      day: date.toLocaleDateString(undefined, { weekday: "short" }),
      created: tickets.filter((t) => t.createdAt.slice(0, 10) === key).length,
      resolved: tickets.filter((t) => t.status === "resolved" && t.updatedAt.slice(0, 10) === key).length,
    };
  });

  return {
    stats: {
      open: counts.open ?? 0,
      pending: counts.waitingForCustomer ?? 0,
      resolved: (counts.resolved ?? 0) + (counts.closed ?? 0),
      breached: 0,
      csat: 0,
      firstResponse: formatDuration(overview.averageFirstResponseTimeMs),
    },
    byStatus,
    byPriority,
    volume: days,
    recent,
    activity,
  };
}

function formatDuration(ms: number) {
  if (!ms) return "—";
  const mins = Math.max(1, Math.round(ms / 60_000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  tickets: (f: TicketFilters) => ["tickets", f] as const,
  ticket: (id: string) => ["ticket", id] as const,
  customers: (q: string) => ["customers", q] as const,
  agents: ["agents"] as const,
  articles: (q: string, c: string) => ["articles", q, c] as const,
  article: (slug: string) => ["article", slug] as const,
};

// ------------------------------- AI actions --------------------------------
export async function analyzeTicket(ticketId: string) {
  const { data } = await apiClient.post(`/ai/analyze-ticket/${ticketId}`);
  return data?.data;
}

export async function generateAIResponse(ticketId: string) {
  const { data } = await apiClient.post(`/ai/generate-response/${ticketId}`);
  return data?.data;
}

export async function improveAIResponse(ticketId: string, input: { draftResponse: string; tone?: string; instructions?: string }) {
  const { data } = await apiClient.post(`/ai/improve-response/${ticketId}`, input);
  return data?.data;
}

export async function suggestAIReply(ticketId: string) {
  const { data } = await apiClient.post(`/ai/suggest-reply/${ticketId}`);
  return data?.data;
}

export async function summarizeTicket(ticketId: string) {
  const { data } = await apiClient.post(`/ai/summarize-ticket/${ticketId}`);
  return data?.data;
}

export async function findKnowledgeBaseAnswer(ticketId: string) {
  const { data } = await apiClient.post(`/ai/knowledge-base-answer/${ticketId}`);
  return data?.data;
}

export async function resolveTicketWithAI(ticketId: string) {
  const { data } = await apiClient.post(`/ai/resolve-ticket/${ticketId}`);
  return data?.data;
}

export async function escalateTicket(ticketId: string, reason?: string) {
  const { data } = await apiClient.post(`/ai/escalate-ticket/${ticketId}`, { reason });
  return data?.data;
}

export async function getTicketAIAnalysis(ticketId: string) {
  const { data } = await apiClient.get(`/ai-analysis/ticket/${ticketId}`);
  return data?.analysis;
}

export async function approveAIResponse(analysisId: string) {
  const { data } = await apiClient.patch(`/ai-analysis/${analysisId}/approve`);
  return data?.analysis;
}
