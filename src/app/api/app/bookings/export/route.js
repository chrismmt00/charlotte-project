// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// GET /api/app/bookings/export   Orders as CSV (store "Export CSV").
// 200:      text/csv attachment "orders.csv"; columns: when,order,customer,items,status,amount
import { devFail } from "@/lib/app/stub";

export async function GET(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const csv = "when,order,customer,items,status,amount\nToday,#1042,[Customer],[Product] x 2,To ship,$[x]\n";
  return new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": 'attachment; filename="orders.csv"' } });
}
