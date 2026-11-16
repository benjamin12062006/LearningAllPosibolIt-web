import { Marked } from 'marked';

const markdown = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    image({ text }) {
      return escapeHtml(text);
    },
    link({ href, tokens }) {
      const label = this.parser.parseInline(tokens);
      if (href.charCodeAt(0) <= 32 || href.includes('\\')) return label;
      const isExternal = /^https?:\/\//iu.test(href);
      const isLocal = /^\/(?!\/)|^#/u.test(href);
      if (!isExternal && !isLocal) return label;
      const target = isExternal
        ? ' target="_blank" rel="noopener noreferrer"'
        : '';
      return `<a href="${escapeHtml(href)}"${target}>${label}</a>`;
    },
  },
});

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderAssistantMarkdown(text: string) {
  return markdown.parse(text, { async: false });
}
