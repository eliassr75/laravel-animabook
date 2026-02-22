import { Head, usePage } from "@inertiajs/react";

interface SeoPayload {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  robots?: string;
  ogType?: string;
  siteName?: string;
  twitterSite?: string;
}

export default function SeoHead() {
  const page = usePage<{ seo?: SeoPayload }>();
  const seo = page.props.seo;

  if (!seo) {
    return null;
  }

  return (
    <Head title={seo.title}>
      {seo.description ? <meta name="description" content={seo.description} /> : null}
      {seo.robots ? <meta name="robots" content={seo.robots} /> : null}
      {seo.canonical ? <link rel="canonical" href={seo.canonical} /> : null}
      {seo.title ? <meta property="og:title" content={seo.title} /> : null}
      {seo.description ? <meta property="og:description" content={seo.description} /> : null}
      {seo.canonical ? <meta property="og:url" content={seo.canonical} /> : null}
      {seo.ogType ? <meta property="og:type" content={seo.ogType} /> : null}
      {seo.siteName ? <meta property="og:site_name" content={seo.siteName} /> : null}
      {seo.image ? <meta property="og:image" content={seo.image} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      {seo.title ? <meta name="twitter:title" content={seo.title} /> : null}
      {seo.description ? <meta name="twitter:description" content={seo.description} /> : null}
      {seo.image ? <meta name="twitter:image" content={seo.image} /> : null}
      {seo.twitterSite ? <meta name="twitter:site" content={seo.twitterSite} /> : null}
    </Head>
  );
}
