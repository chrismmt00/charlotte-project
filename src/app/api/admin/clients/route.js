import { listClients } from "@/lib/admin/sample-clients";

// STUB until the back end ships this route. Requires an admin session in the real handler.
// GET /api/admin/clients -> 200 { clients: ClientSummary[] }   (shape in src/lib/admin/sample-clients.js)
export function GET() {
  return Response.json({ clients: listClients() });
}
