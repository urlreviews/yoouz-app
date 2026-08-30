const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const injectCode = `
  function injectOpenGraphTags(html: string, meta: any) {
    let headInject = \`
    <title>\${meta.title}</title>
    <meta name="description" content="\${meta.description}" />
    <meta name="keywords" content="\${meta.keywords}" />
    <meta property="og:title" content="\${meta.title}" />
    <meta property="og:description" content="\${meta.description}" />
    <meta property="og:image" content="\${meta.imageUrl}" />
    <meta property="og:url" content="\${meta.url}" />
    <meta property="og:type" content="\${meta.type}" />
    <meta property="og:site_name" content="Yoouz" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="\${meta.title}" />
    <meta name="twitter:description" content="\${meta.description}" />
    <meta name="twitter:image" content="\${meta.imageUrl}" />
    <link rel="canonical" href="\${meta.url}" />
    \`;

    if (meta.videoUrl) {
      headInject += \`
      <meta property="og:video" content="\${meta.videoUrl}" />
      <meta property="og:video:type" content="video/mp4" />
      <meta property="og:video:width" content="1080" />
      <meta property="og:video:height" content="1920" />
      \`;
    }

    if (meta.structuredData) {
      headInject += \`
      <script type="application/ld+json">
        \${JSON.stringify(meta.structuredData)}
      </script>
      \`;
    }

    return html
      .replace(/<title>.*?<\\/title>/, '')
      .replace('</head>', \`\${headInject}</head>\`);
  }
`;

if (!code.includes('function injectOpenGraphTags')) {
  code = code.replace('async function resolveMetadataForRequest(req: any) {', injectCode + '\\n  async function resolveMetadataForRequest(req: any) {');
  fs.writeFileSync('server.ts', code);
  console.log("Injected injectOpenGraphTags");
}
