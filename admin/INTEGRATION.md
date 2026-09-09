# Helpdesk frontend ↔ Express API integration

The Lovable mock API has been replaced by a real Axios/TanStack Query integration.

## Run

1. Start MongoDB and the backend.
2. In the backend `.env`, set `DB_URL`, `JWT_SECRET`, and `CLIENT_URL=http://localhost:5173`.
3. Start the backend with `npm run dev` (default port 3000).
4. In this frontend, copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:3000/api`.
5. Install frontend dependencies and run `npm run dev`.

## Authentication

- `POST /api/auth/register` creates an organization and its first owner.
- `POST /api/auth/login` returns the JWT and also sets the HTTP-only cookie.
- The frontend stores the returned JWT in `localStorage` and sends it as `Authorization: Bearer ...`.
- `GET /api/auth/me` hydrates the session after a page refresh.
- `POST /api/auth/logout` clears the server cookie and local token.

## API compatibility mapping

- `pending` in the UI ↔ `waiting_for_customer` in the API.
- UI ticket `reference` is generated from backend `ticketNumber` as `HD-<ticketNumber>`.
- UI ticket `category` is derived from populated `categoryId.name`.
- UI ticket `tags` are derived from populated Tag documents.
- UI ticket conversation is loaded from `/api/messages/ticket/:ticketId` because the ticket endpoint returns the ticket only.
- Knowledge-base article pages use the article slug in the UI and resolve it through the existing article list endpoint because the backend detail endpoint currently accepts an ID.

## Important backend additions

Two small backend changes were made because the UI needed functionality that did not exist in the original endpoint set:

1. Creating a ticket now stores its description as the first inbound customer message.
2. `PATCH /api/knowledge-base/:id/helpful` records article helpful feedback.

The backend also protects user role changes so admins cannot promote users to owner/admin and the owner cannot be deactivated or have the owner role removed.

## AI

The frontend API layer exposes:

- analyzeTicket
- generateAIResponse
- improveAIResponse
- suggestAIReply
- summarizeTicket
- findKnowledgeBaseAnswer
- resolveTicketWithAI
- escalateTicket
- getTicketAIAnalysis
- approveAIResponse

The current uploaded Lovable UI does not yet contain dedicated AI pages/components for all of these actions, so the functions are ready for the next UI integration step.
