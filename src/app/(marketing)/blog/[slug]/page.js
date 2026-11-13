import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import PostShare from "@/components/site/PostShare";
import { byline, getPost, postSlugs, relatedPosts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return postSlugs();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found", robots: { index: false } };
  return {
    title: post.title,
    description: post.dek,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.dek, ...(post.date ? { publishedTime: post.date } : {}) },
  };
}

function Block({ b }) {
  if (b.type === "h2") {
    return <h2 className="font-display font-normal text-[32px] leading-[1.15] mt-[18px] mb-0 text-fg">{b.text}</h2>;
  }
  if (b.type === "quote") {
    return (
      <blockquote className="my-2.5 mx-0 border-l-2 border-accent-light py-1 pl-6 font-display italic text-[28px] leading-[1.25] text-fg">
        “{b.text}”
      </blockquote>
    );
  }
  if (b.type === "ul") {
    return (
      <ul className="m-0 pl-[22px] list-disc flex flex-col gap-2">
        {b.items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    );
  }
  return <p className="m-0">{b.text}</p>;
}

// Prerendered from generateStaticParams. The Suspense boundary keeps params (URL data) out of the static shell.
export default function PostPage({ params }) {
  return (
    <Suspense fallback={<PostFallback />}>
      <PostContent params={params} />
    </Suspense>
  );
}

function PostFallback() {
  return (
    <header className="px-4 sm:px-6 pt-[150px] pb-10" aria-busy="true">
      <div className="max-w-[760px] mx-auto flex flex-col gap-6">
        <div className="h-4 w-40 rounded-full bg-surface" />
        <div className="h-[clamp(44px,7vw,96px)] max-w-[820px] rounded-card bg-surface" />
        <div className="h-5 max-w-[560px] rounded-full bg-surface" />
      </div>
    </header>
  );
}

async function PostContent({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const related = relatedPosts(post);
  const url = `${SITE_URL}/blog/${post.slug}`;

  return (
    <>
      <header className="px-4 sm:px-6 pt-[150px] pb-10">
        <div className="max-w-[760px] mx-auto flex flex-col gap-[18px]">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <ol className="list-none p-0 m-0 flex flex-wrap items-center gap-2.5 text-[13px] text-muted-2">
              <li>
                <Link href="/blog" className="min-h-11 inline-flex items-center hover:text-fg">
                  Notes
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fg">
                {post.topic}
              </li>
            </ol>
          </nav>
          <h1 className="font-display font-normal text-[clamp(36px,5vw,60px)] leading-[1.05] tracking-[-.01em] m-0">{post.title}</h1>
          <p className="text-lg leading-[1.6] text-muted-2 m-0">{post.dek}</p>
          <div className="flex items-center gap-3 text-sm text-muted-2">
            <span aria-hidden="true" className="w-10 h-10 rounded-full bg-surface border border-border-2 inline-flex items-center justify-center text-[13px] text-fg flex-none">
              {post.author.replace(/^\[/, "").charAt(0)}
            </span>
            <span>{byline(post)}</span>
          </div>
        </div>
      </header>

      <article className="post-body px-4 sm:px-6 pb-20">
        <div className="max-w-[760px] mx-auto flex flex-col gap-[22px] text-base sm:text-[17px] leading-[1.8] text-muted-2">
          {/* Swap for a next/image cover once posts have one. */}
          <span
            role="img"
            aria-label={post.cover}
            className="aspect-video rounded-card border border-border bg-[radial-gradient(90%_120%_at_80%_8%,rgba(137,170,204,.32),transparent_55%),var(--bg-deep)] flex items-end p-[18px] mb-2.5"
          >
            <span aria-hidden="true" className="text-[11px] text-muted-2 bg-[rgba(var(--bg-rgb),.7)] rounded-full px-2.5 py-1">
              {post.cover}
            </span>
          </span>
          {post.body.map((b, i) => (
            <Block key={i} b={b} />
          ))}
          <div className="border border-border rounded-card px-6 sm:px-7 py-6 bg-surface flex flex-wrap justify-between items-center gap-4 mt-4 text-[15px] text-fg">
            <span>Want the number for your own business?</span>
            <Button href="/quote">Build an estimate</Button>
          </div>
        </div>
      </article>

      <section aria-label="Share and more" className="px-4 sm:px-6 pb-[110px]">
        <div className="max-w-[760px] mx-auto flex flex-col gap-6 border-t border-border pt-6">
          <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
            <span className="text-muted-2">
              Filed under{" "}
              <Link href="/blog" className="text-accent-light hover:text-fg">
                {post.topic}
              </Link>
            </span>
            <PostShare url={url} title={post.title} />
          </div>
          {related.length ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="card-post flex flex-col gap-2.5 border border-border rounded-card p-6 text-fg bg-surface transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(78,133,191,calc(.12*var(--shadow-k)))]"
                >
                  <span className="eyebrow !text-accent-light">{p.topic}</span>
                  <span className="text-xl font-medium leading-[1.25]">{p.title}</span>
                  <span className="text-sm leading-[1.6] text-muted-2">{p.dek}</span>
                  <span className="text-[13px] text-muted-2 mt-auto pt-2">{byline(p)}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
