// components/SEO.tsx
import Head from 'next/head'
import { useRouter } from 'next/router'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  keywords?: string
  noindex?: boolean
}

export default function SEO({ 
  title, 
  description, 
  canonical, 
  ogImage = '/og-image.jpg', 
  ogType = 'website',
  publishedTime,
  modifiedTime,
  author = 'My Lead Assistant',
  keywords = 'AI lead scoring, lead generation, sales automation, CRM alternative, lead follow up software',
  noindex = false
}: SEOProps) {
  const router = useRouter()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'
  const canonicalUrl = canonical || `${siteUrl}${router.asPath.split('?')[0]}`
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  return (
    <Head>
      {/* Grunnleggende */}
      <title>{title} | My Lead Assistant</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}
      
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="My Lead Assistant" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@L30401My" />
      <meta name="twitter:creator" content="@L30401My" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Artikkel-spesifikt */}
      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && (
        <meta property="article:author" content={author} />
      )}
      
      {/* Ekstra for SEO */}
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
    </Head>
  )
}