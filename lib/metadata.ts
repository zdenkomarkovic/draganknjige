import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./constants";

interface BuildMetadataOptions {
  title?: string;
  description?: string;
  /** Putanja do slike za OG (relativna od /public ili apsolutna URL) */
  image?: string;
  /** Canonical URL - ako nije naveden, koristi SITE_URL */
  url?: string;
  /** Da li da noindex ova stranica */
  noIndex?: boolean;
  /** Tip stranice za OG */
  type?: "website" | "article";
  /** Datum objave (za blog postove) */
  publishedTime?: string;
}

/**
 * Helper za generisanje Next.js Metadata objekta.
 * Koristiti u svakom page.tsx fajlu.
 *
 * @example
 * // U page.tsx:
 * export const metadata = buildMetadata({
 *   title: "O nama",
 *   description: "Kratki opis stranice",
 * });
 */
export function buildMetadata({
  title,
  description,
  image,
  url,
  noIndex = false,
  type = "website",
  publishedTime,
}: BuildMetadataOptions = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  // Canonical uvek apsolutan i sa trailing slash-om (isto kao na originalnom sajtu)
  const path = url ?? "/";
  const canonicalUrl = (path.startsWith("http") ? path : `${SITE_URL}${path}`).replace(/\/?$/, "/");
  // Bez slike se koristi app/opengraph-image.tsx (Next ga dodaje automatski)
  const ogImage = image;

  return {
    title: { absolute: fullTitle },
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type,
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
      }),
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
