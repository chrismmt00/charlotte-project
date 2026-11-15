import Button from "@/components/ui/Button";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/ui/Section";
import BlogList from "@/components/site/BlogList";
import { POSTS, TOPICS, byline } from "@/lib/posts";

export const metadata = {
  title: "Notes",
  description:
    "Notes from Klyvora in Charlotte: what we learn building for independent businesses, with the numbers when owners let us share them.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  if (!POSTS.length) notFound();
  const posts = [...POSTS]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map(({ slug, title, dek, topic, cover, ...p }) => ({
      slug,
      title,
      dek,
      topic,
      cover,
      byline: byline(p),
    }));
  return (
    <>
      <header className="px-4 sm:px-6 pt-[150px] pb-10">
        <div className="container-site">
          <Eyebrow className="mb-5">Notes</Eyebrow>
          <h1 className="display-page m-0 mb-[18px]">Notes from Charlotte.</h1>
          <p className="text-base leading-[1.75] text-muted-2 m-0 max-w-[720px]">
            What we learn building for independent businesses, with the numbers
            when owners let us share them. No listicles, no hype. A post when we
            have something to say.
          </p>
        </div>
      </header>

      {posts.length ? (
        <section aria-label="Posts" className="px-4 sm:px-6 pt-5 pb-[110px]">
          <div className="container-site">
            <BlogList posts={posts} topics={TOPICS} />
          </div>
        </section>
      ) : (
        <section
          aria-label="No posts yet"
          className="px-4 sm:px-6 pt-5 pb-[110px]"
        >
          <div className="container-site border border-dashed border-border-2 rounded-tile px-6 sm:px-8 py-12 text-center flex flex-col items-center gap-3">
            <h2 className="font-display italic font-normal text-[32px] leading-[1.1] m-0">
              First posts land after the first launches.
            </h2>
            <p className="text-sm text-muted-2 max-w-[460px] m-0">
              We write when there is a number to show. Until then, the prices
              and the ownership terms are on the site.
            </p>
            <Button href="/pricing" variant="secondary" className="mt-2 !px-6">
              See every price
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
