// STUB until the back end ships this route. Requires the owner's session and scopes every row to their business.
// GET /api/app/customers/export   The owner's customer list as CSV. It is theirs; export any time.
// 200:      text/csv attachment "customers.csv"; columns: name,phone,visits,last,spent,texts,notes
import { devFail } from "@/lib/app/stub";

export async function GET(request) {
  const failed = devFail(request);
  if (failed) return failed;
  const csv = "name,phone,visits,last,spent,texts,notes\n[Customer A],(704) 555-01[xx],7,2 days ago,$[x],yes,\n";
  return new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": 'attachment; filename="customers.csv"' } });
}
