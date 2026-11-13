// STUB until the back end ships this route (docs/prompts/BACKEND-LOOP.md).
// GET -> a receipt PDF for a paid invoice (the real route redirects to the Stripe receipt or streams a PDF).
export async function GET(request, ctx) {
  const { id } = await ctx.params;
  return new Response(`Receipt ${id} (placeholder until the back end ships this route).\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${id.replace(/[^A-Za-z0-9-]/g, "")}.txt"` },
  });
}
