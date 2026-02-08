import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  // Load messages from filesystem (works in both SSR and client)
  let messages = {};
  
  // Try multiple possible paths for messages directory
  const possiblePaths = [
    join(process.cwd(), 'messages', `${locale}.json`), // Production (Vercel) - most common
    join(process.cwd(), 'frontend', 'messages', `${locale}.json`), // Monorepo structure
  ];
  
  // Add relative path if __dirname is available (CommonJS) or use import.meta.url (ESM)
  try {
    if (typeof __dirname !== 'undefined') {
      possiblePaths.push(resolve(__dirname, '..', '..', 'messages', `${locale}.json`));
    } else if (typeof import.meta !== 'undefined' && import.meta.url) {
      const fileUrl = new URL(import.meta.url);
      const filePath = fileUrl.pathname;
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
      possiblePaths.push(resolve(dirPath, '..', '..', 'messages', `${locale}.json`));
    }
  } catch (e) {
    // Ignore if path resolution fails
  }

  let messagesLoaded = false;
  for (const messagesPath of possiblePaths) {
    try {
      if (existsSync(messagesPath)) {
        const messagesContent = await readFile(messagesPath, 'utf-8');
        messages = JSON.parse(messagesContent);
        messagesLoaded = true;
        break;
      }
    } catch (error) {
      // Continue to next path
      continue;
    }
  }

  // Fallback: try to load default locale messages if current locale failed
  if (!messagesLoaded && locale !== routing.defaultLocale) {
    for (const messagesPath of possiblePaths.map(p => p.replace(`${locale}.json`, `${routing.defaultLocale}.json`))) {
      try {
        if (existsSync(messagesPath)) {
          const messagesContent = await readFile(messagesPath, 'utf-8');
          messages = JSON.parse(messagesContent);
          messagesLoaded = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
  }

  // If still no messages loaded, log error but return empty object to prevent crash
  if (!messagesLoaded) {
    console.error(`Failed to load messages for locale ${locale}. Tried paths:`, possiblePaths);
  }

  return {
    locale,
    messages,
  };
});
