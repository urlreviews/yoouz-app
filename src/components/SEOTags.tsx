import { useEffect } from 'react';

interface SEOTagsProps {
  title: string;
  description: string;
  image?: string;
  touchIcon?: string;
  url?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  updateTitle?: boolean;
}

export function SEOTags({ title, description, image, touchIcon, url, jsonLd, updateTitle = true }: SEOTagsProps) {
  useEffect(() => {
    // 1. Update Title only if requested
    if (updateTitle && title) {
      document.title = title;
    }

    // 2. Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // 3. Update Open Graph Tags
    const updateOGTag = (property: string, content: string) => {
      if (!content) return;
      let cleanContent = content.trim();
      if (cleanContent.startsWith('http://')) {
        cleanContent = 'https://' + cleanContent.slice(7);
      }
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', cleanContent);
    };

    const updateLinkTag = (rel: string, href: string, extraAttrs?: Record<string, string>) => {
      if (!href) return;
      let cleanHref = href.trim();
      let selector = `link[rel="${rel}"]`;
      if (extraAttrs?.sizes) {
        selector += `[sizes="${extraAttrs.sizes}"]`;
      }
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        if (extraAttrs) {
          for (const [k, v] of Object.entries(extraAttrs)) {
            tag.setAttribute(k, v);
          }
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('href', cleanHref);
    };

    updateOGTag('og:title', title);
    updateOGTag('og:description', description);
    if (image) updateOGTag('og:image', image);
    if (url) {
      updateOGTag('og:url', url);
      updateLinkTag('canonical', url);
    }
    updateOGTag('og:type', 'website');

    if (touchIcon) {
      updateLinkTag('apple-touch-icon', touchIcon, { sizes: '180x180' });
      updateLinkTag('apple-touch-icon', touchIcon);
    }
    updateLinkTag('icon', '/favicon.svg', { type: 'image/svg+xml' });
    updateLinkTag('icon', '/favicon.ico', { type: 'image/x-icon' });
    updateLinkTag('shortcut icon', '/favicon.ico');

    // 4. Update JSON-LD Structured Data
    if (jsonLd) {
      let script = document.querySelector('#seo-json-ld');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('id', 'seo-json-ld');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      if (jsonLd) {
        const script = document.querySelector('#seo-json-ld');
        if (script) script.remove();
      }
    };
  }, [title, description, image, touchIcon, url, jsonLd, updateTitle]);

  return null;
}
