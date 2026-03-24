import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Configure marked
      const renderer = new marked.Renderer();
      renderer.code = function({ text, lang }: { text: string; lang?: string }) {
        if (lang && hljs.getLanguage(lang)) {
          const highlighted = hljs.highlight(text, { language: lang }).value;
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        }
        const highlighted = hljs.highlightAuto(text).value;
        return `<pre><code class="hljs">${highlighted}</code></pre>`;
      };

      const raw = marked(content, { renderer }) as string;
      // Basic sanitization: strip script tags and event handlers
      const clean = raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '');
      ref.current.innerHTML = clean;
    }
  }, [content]);

  return <div ref={ref} className={`markdown-renderer ${className}`} />;
};
