import Head from 'next/head'
import Script from 'next/script'

const GA_ID = 'G-17814229256'

export default function TestGA() {
  return (
    <>
      <Head>
        <title>Test GA</title>
      </Head>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Google Analytics Test Side</h1>
        <p>Sjekk Realtime i Google Analytics nå!</p>
      </div>
    </>
  )
}