// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// GET -> a client file: proposal, brand, handover. The real route checks the contact owns the project and
// returns a short-lived Cloudflare R2 signed URL (302). The site code is a GitHub repository, not a download here.
export async function GET(request, ctx) {
  const { id } = await ctx.params;
  return new Response(`File ${id} (placeholder until the back end ships this route).\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${id.replace(/[^A-Za-z0-9-]/g, "")}.txt"` },
  });
}
