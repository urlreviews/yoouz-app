import https from 'https';
import http from 'http';

export async function fetchBase64(url: string): Promise<string> {
  if (!url) return '';
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) return resolve('');
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
    }).on('error', () => resolve(''));
  });
}
