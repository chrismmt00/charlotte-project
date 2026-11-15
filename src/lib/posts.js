// Blog posts for /blog and /blog/[slug].
// POSTS is empty on purpose: nothing is published yet. The design's planned titles are kept in
// PLANNED_TOPICS for the founders, never rendered as posts.
// The back end (CMS, phase 4) will replace this with the Post model and must keep the same shape.
//
// Shape:
// {
//   slug, title, dek,                // dek: the one-line summary under the title
//   topic,                           // a label from TOPICS below
//   author, date,                    // date: "YYYY-MM-DD"
//   minutes,                         // reading time
//   cover,                           // caption until a real cover image exists
//   body: [                          // blocks, rendered in order
//     { type: "p", text } | { type: "h2", text } | { type: "quote", text } | { type: "ul", items: [] }
//   ],
// }
// Prices quoted in a post must come from src/lib/offers.js.

export const POSTS = [];

export const TOPICS = ["Pricing", "Ownership", "Restaurants", "Booking", "AI"];

// Planned posts from the design canvas (not written, not published).
export const PLANNED_TOPICS = [
  "Why the monthly plan is optional, and what it actually buys",
  "You own the site. Here is the part most agencies skip.",
  "What a kiosk changes at lunch, measured",
  "Deposits cut no-shows. The numbers from one barbershop.",
  "What our text-back will and won’t say",
];

// TEMPLATE ONLY. Never listed on /blog and never served in production.
// generateStaticParams uses its slug so the route builds while POSTS is empty (Cache Components
// needs at least one param), and `next dev` renders it so the founders can review the layout.
export const POST_TEMPLATE = {
  slug: "template-placeholder",
  title: "[DRAFT] Post title",
  dek: "[One-line summary of the post.]",
  topic: "Pricing",
  author: "[Author name]",
  date: null,
  minutes: "[n]",
  cover: "[Cover · 16:9 · 1600×900]",
  body: [
    { type: "p", text: "[Opening paragraph.]" },
    { type: "h2", text: "[Section heading]" },
    {
      type: "p",
      text: "[Paragraph. Any price quoted here comes from the same menu as the site.]",
    },
    {
      type: "quote",
      text: "[Pull quote, from the post itself or an owner who approved it.]",
    },
    { type: "h2", text: "[Section heading]" },
    { type: "p", text: "[Paragraph with a list below.]" },
    { type: "ul", items: ["[Point one]", "[Point two]", "[Point three]"] },
  ],
};

const SHOW_TEMPLATE = false; // Reference data is retained but never exposed on public routes.

export function getPost(slug) {
  const found = POSTS.find((p) => p.slug === slug);
  if (found) return found;
  if (SHOW_TEMPLATE && slug === POST_TEMPLATE.slug) return POST_TEMPLATE;
  return null;
}

export function postSlugs() {
  return POSTS.length
    ? POSTS.map((p) => ({ slug: p.slug }))
    : [{ slug: POST_TEMPLATE.slug }];
}

// Up to `n` other posts, same topic first.
export function relatedPosts(post, n = 2) {
  const others = POSTS.filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.topic === post.topic);
  const rest = others.filter((p) => p.topic !== post.topic);
  return [...same, ...rest].slice(0, n);
}

export function formatDate(iso) {
  if (!iso) return "[date]";
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function byline(p) {
  return `${p.author} · ${formatDate(p.date)} · ${p.minutes} min read`;
}
