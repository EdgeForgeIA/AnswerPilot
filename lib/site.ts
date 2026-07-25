/**
 * Shared social-card constants.
 *
 * app/opengraph-image.tsx generates the site card at /opengraph-image. Next only
 * auto-attaches that file to a page's metadata when the page does NOT declare its
 * own `openGraph` block — so any page that sets one (the blog does, for per-post
 * titles) has to reference the image explicitly or ship an imageless card.
 */
export const SITE_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "VeriQuill — Security questionnaires, answered in minutes",
} as const;
