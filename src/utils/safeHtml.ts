const BLOCKED_TAGS = new Set([
  'base',
  'embed',
  'form',
  'iframe',
  'link',
  'meta',
  'object',
  'script',
  'style',
]);

const URL_ATTRIBUTES = new Set(['action', 'formaction', 'href', 'src', 'xlink:href']);
const UNSAFE_URL_PATTERN = /^\s*(javascript:|vbscript:|data:text\/html)/i;

function fallbackStripTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sanitizeHtml(value: string): string {
  if (!value) return '';
  if (typeof DOMParser === 'undefined') return value;

  const doc = new DOMParser().parseFromString(value, 'text/html');

  for (const tagName of BLOCKED_TAGS) {
    doc.querySelectorAll(tagName).forEach((node) => node.remove());
  }

  doc.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const attrName = attribute.name.toLowerCase();
      const attrValue = attribute.value.trim();

      if (attrName.startsWith('on') || attrName === 'style') {
        element.removeAttribute(attribute.name);
        return;
      }

      if (URL_ATTRIBUTES.has(attrName) && UNSAFE_URL_PATTERN.test(attrValue)) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return doc.body.innerHTML;
}

export function extractPlainText(value: string): string {
  if (!value) return '';
  if (typeof DOMParser === 'undefined') return fallbackStripTags(value);

  const sanitized = sanitizeHtml(value);
  const doc = new DOMParser().parseFromString(sanitized, 'text/html');
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
}
