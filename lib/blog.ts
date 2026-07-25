import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import { z } from "zod";

/**
 * File-backed blog. Posts are markdown files in /content/blog with frontmatter.
 * Nothing here touches the database — posts ship with the repo, so the routes
 * are fully static (see generateStaticParams in app/blog/[slug]/page.tsx).
 *
 * Rendering is plain markdown (GFM) via `marked`. `.mdx` files are accepted and
 * parsed the same way, so JSX/component syntax inside them will NOT execute —
 * it would render as literal text. Keep post bodies to markdown.
 */

const POSTS_DIR = path.join(process.cwd(), "content", "blog");
const POST_EXTENSIONS = [".md", ".mdx"];

/** Post body markdown is repo-committed content we author, so raw HTML is allowed through. */
const marked = new Marked({
  gfm: true,
  breaks: false,
  async: false,
  hooks: {
    // Wrap tables so wide ones scroll inside the column instead of widening the page.
    postprocess(html: string) {
      return html
        .replace(/<table>/g, '<div class="table-scroll"><table>')
        .replace(/<\/table>/g, "</table></div>");
    },
  },
});

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase words separated by single hyphens"),
  // Unquoted YAML dates parse to a Date; quoted ones stay strings. Accept both.
  date: z.union([z.string(), z.date()]),
});

export type PostMeta = {
  title: string;
  description: string;
  slug: string;
  /** Always normalized to YYYY-MM-DD. */
  date: string;
};

export type Post = PostMeta & { html: string };

/**
 * Normalize a frontmatter date to YYYY-MM-DD.
 * Date-only values are treated as UTC throughout (see formatPostDate) so a post
 * dated the 20th never renders as the 19th west of Greenwich.
 */
function normalizeDate(value: string | Date, file: string): string {
  const raw = value instanceof Date ? value.toISOString().slice(0, 10) : value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`Blog post "${file}": date must be YYYY-MM-DD, got "${String(value)}".`);
  }
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    throw new Error(`Blog post "${file}": "${raw}" is not a real calendar date.`);
  }
  return raw;
}

function postFiles(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => POST_EXTENSIONS.includes(path.extname(file).toLowerCase()))
    .sort();
}

function readPost(file: string): Post {
  const source = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(source);

  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    // Fail the build rather than shipping a post with a broken URL or empty <title>.
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Blog post "${file}" has invalid frontmatter — ${issues}`);
  }
  if (!content.trim()) {
    throw new Error(`Blog post "${file}" has no body content.`);
  }

  // The frontmatter slug is authoritative for the URL — the filename is free to differ.
  return {
    title: parsed.data.title,
    description: parsed.data.description,
    slug: parsed.data.slug,
    date: normalizeDate(parsed.data.date, file),
    html: marked.parse(content) as string,
  };
}

/** All posts, newest first. Ties break on slug so ordering is deterministic. */
export function getAllPosts(): Post[] {
  const posts = postFiles().map(readPost);

  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.slug)) {
      throw new Error(`Duplicate blog slug "${post.slug}" — slugs must be unique.`);
    }
    seen.add(post.slug);
  }

  return posts.sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
}

export function getPostBySlug(slug: string): Post | null {
  return getAllPosts().find((post) => post.slug === slug) ?? null;
}

/** Date-only values are formatted in UTC so the displayed day matches the frontmatter. */
export function formatPostDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
