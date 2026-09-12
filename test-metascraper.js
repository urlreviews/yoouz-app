const url = 'https://mastercard.com';
fetch(url, { redirect: 'follow' })
  .then(res => res.text())
  .then(html => {
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    console.log(ogImage ? ogImage[1] : null);
  });
