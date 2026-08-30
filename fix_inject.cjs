const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startIndex = code.indexOf('function injectOpenGraphTags(html: string, meta: any) {');
const endIndex = code.indexOf('  async function resolveMetadataForRequest(req: any) {');

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `function injectOpenGraphTags(html: string, meta: any) {
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

    // Strip out all existing title and og/twitter meta tags so they don't conflict
    return html
      .replace(/<title>.*?<\\/title>/g, '')
      .replace(/<meta\\s+(?:name|property)=["'](?:description|keywords|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '')
      .replace(/<link\\s+rel=["']canonical["'][^>]*>/gi, '')
      .replace('</head>', \`\${headInject}</head>\`);
  }
`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync('server.ts', code);
  console.log("Fixed injectOpenGraphTags");
} else {
  console.log("Could not find start or end index");
}
