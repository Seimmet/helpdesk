// Shared frontend types retained for the UI. Data now comes from the Express API.

export type Role = "owner" | "admin" | "agent";
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export const categories = [
  "Billing",
  "Bug report",
  "Account access",
  "Integrations",
  "Feature request",
  "Onboarding",
];
