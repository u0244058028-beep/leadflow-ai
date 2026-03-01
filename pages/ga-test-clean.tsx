export default function GaTestClean() {
  return (
    <html>
      <head>
        <title>GA Test</title>
        {/* Google Analytics script - helt standard */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-17814229256"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-17814229256');
            `
          }}
        />
      </head>
      <body>
        <h1>Google Analytics Test</h1>
        <p>Åpne Google Analytics → Realtime og se om du dukker opp.</p>
      </body>
    </html>
  )
}