import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookMarked } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { formatPostDate, getAllPosts } from "@/lib/blog";
import { SITE_OG_IMAGE } from "@/lib/site";

const title = "Blog";
const description =
  "Field notes on security questionnaires, vendor reviews, and keeping an answer library that stays accurate.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `${title} · VeriQuill`,
    description,
    url: "/blog",
    siteName: "VeriQuill",
    type: "website",
    images: [SITE_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · VeriQuill`,
    description,
    images: [SITE_OG_IMAGE],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div>
      <p className="eyebrow">Blog</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
        Notes from the questionnaire queue
      </h1>
      <p className="mt-3 max-w-xl text-pretty leading-relaxed text-ink-soft">{description}</p>

      {posts.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<BookMarked className="h-6 w-6" aria-hidden />}
            title="No posts yet"
            description="New writing on security reviews and answer libraries will show up here."
          />
        </div>
      ) : (
        <ul className="mt-12 space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-line bg-surface p-6 shadow-card transition-colors hover:border-line-strong"
              >
                <time dateTime={post.date} className="font-mono text-xs text-ink-faint">
                  {formatPostDate(post.date)}
                </time>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink group-hover:text-accent">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{post.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  Read post
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
