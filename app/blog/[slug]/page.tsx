import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatPostDate, getAllPosts, getPostBySlug } from "@/lib/blog";
import { SITE_OG_IMAGE } from "@/lib/site";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${post.title} · VeriQuill`,
      description: post.description,
      url,
      siteName: "VeriQuill",
      type: "article",
      publishedTime: `${post.date}T00:00:00.000Z`,
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} · VeriQuill`,
      description: post.description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article>
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> All posts
      </Link>

      <header className="mt-8 border-b border-line pb-8">
        <time dateTime={post.date} className="font-mono text-xs text-ink-faint">
          {formatPostDate(post.date)}
        </time>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-ink">
          {post.title}
        </h1>
        <p className="mt-3 text-pretty leading-relaxed text-ink-soft">{post.description}</p>
      </header>

      <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />

      <aside className="mt-14 rounded-xl border border-line bg-surface px-6 py-8 text-center shadow-card">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Stop rewriting the same security answers
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
          VeriQuill drafts cited, confidence-graded answers from your own approved library. The
          first questionnaire is free.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 text-sm font-medium text-on-accent hover:bg-accent-strong"
        >
          Start free <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </aside>
    </article>
  );
}
