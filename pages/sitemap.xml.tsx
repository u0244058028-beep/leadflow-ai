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