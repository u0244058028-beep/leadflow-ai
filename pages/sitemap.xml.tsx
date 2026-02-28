// pages/sitemap.xml.tsx
import { GetServerSideProps } from 'next'
import { supabase } from '@/lib/supabaseClient'

const generateSitemapXml = (urls: { loc: string; lastmod: string; priority: string }[]) => {
  const urlSet = urls
    .map((url) => {
      return `
        <url>
          <loc>${url.loc}</loc>
          <lastmod>${url.lastmod}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>${url.priority}</priority>
        </url>
      `
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urlSet}
    </urlset>`
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.myleadassistant.com'
  const today = new Date().toISOString().split('T')[0]
  
  // Statiske sider med prioritet
  const staticPages = [
    { loc: `${baseUrl}`, lastmod: today, priority: '1.0' }, // Høyest prioritet
    { loc: `${baseUrl}/pricing`, lastmod: today, priority: '0.9' },
    { loc: `${baseUrl}/about`, lastmod: today, priority: '0.7' },
    { loc: `${baseUrl}/contact`, lastmod: today, priority: '0.7' },
    { loc: `${baseUrl}/privacy`, lastmod: today, priority: '0.5' },
    { loc: `${baseUrl}/login`, lastmod: today, priority: '0.5' },
    { loc: `${baseUrl}/signup`, lastmod: today, priority: '0.8' },
    { loc: `${baseUrl}/blog`, lastmod: today, priority: '0.8' },
    { loc: `${baseUrl}/guides`, lastmod: today, priority: '0.8' },
    { loc: `${baseUrl}/comparisons`, lastmod: today, priority: '0.8' },
  ]

  // Hent blogginnlegg, guider og sammenligninger fra databasen
  let dynamicPages: { loc: string; lastmod: string; priority: string }[] = []
  
  try {
    // Hent landingssider laget av brukere (hvis de skal indekseres)
    const { data: landingPages } = await supabase
      .from('landing_pages')
      .select('slug, updated_at')
      .eq('published', true)

    if (landingPages) {
      const landingPageUrls = landingPages.map((page) => ({
        loc: `${baseUrl}/s/${page.slug}`,
        lastmod: page.updated_at?.split('T')[0] || today,
        priority: '0.6'
      }))
      dynamicPages = [...dynamicPages, ...landingPageUrls]
    }

    // Hvis du har en blogg-tabell
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)

    if (blogPosts) {
      const blogUrls = blogPosts.map((post) => ({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updated_at?.split('T')[0] || today,
        priority: '0.7'
      }))
      dynamicPages = [...dynamicPages, ...blogUrls]
    }

    // Hvis du har guides
    const { data: guides } = await supabase
      .from('guides')
      .select('slug, updated_at')
      .eq('published', true)

    if (guides) {
      const guideUrls = guides.map((guide) => ({
        loc: `${baseUrl}/guides/${guide.slug}`,
        lastmod: guide.updated_at?.split('T')[0] || today,
        priority: '0.7'
      }))
      dynamicPages = [...dynamicPages, ...guideUrls]
    }

    // Hvis du har sammenligningssider
    const { data: comparisons } = await supabase
      .from('comparisons')
      .select('slug, updated_at')
      .eq('published', true)

    if (comparisons) {
      const comparisonUrls = comparisons.map((comp) => ({
        loc: `${baseUrl}/comparisons/${comp.slug}`,
        lastmod: comp.updated_at?.split('T')[0] || today,
        priority: '0.7'
      }))
      dynamicPages = [...dynamicPages, ...comparisonUrls]
    }

  } catch (error) {
    console.error('Error fetching dynamic pages for sitemap:', error)
  }

  // Kombiner alle sider
  const allPages = [...staticPages, ...dynamicPages]
  
  // Generer XML
  const sitemap = generateSitemapXml(allPages)

  // Send som XML
  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, max-age=86400') // Cache i 24 timer
  res.write(sitemap)
  res.end()

  return { props: {} }
}

export default function Sitemap() {
  return null
}