import { useEffect } from 'react';

interface SEOTagsProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  updateTitle?: boolean;
}

export function SEOTags({ title, description, image, url, jsonLd, updateTitle = true }: SEOTagsProps) {
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
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOGTag('og:title', title);
    updateOGTag('og:description', description);
    if (image) updateOGTag('og:image', image);
    if (url) updateOGTag('og:url', url);
    updateOGTag('og:type', 'website');

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
      // Optional cleanup if needed when component unmounts
      // For a SPA, we usually leave the latest tags, but clearing JSON-LD prevents duplicates if navigating
      if (jsonLd) {
        const script = document.querySelector('#seo-json-ld');
        if (script) script.remove();
      }
    };
  }, [title, description, image, url, jsonLd]);

  return null;
}
