import { createElement, Fragment, type ReactNode } from 'react';

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
    doc.querySelectorAll(tagName).forEach((node) => {
      node.remove();
    });
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

function mapAttributes(element: Element): Record<string, string> {
  const props: Record<string, string> = {};
  Array.from(element.attributes).forEach((attribute) => {
    const attrName = attribute.name === 'class' ? 'className' : attribute.name;
    props[attrName] = attribute.value;
  });
  return props;
}

function domNodeToReact(node: ChildNode, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const children = Array.from(element.childNodes).map((child, index) =>
    domNodeToReact(child, `${key}-${index}`),
  );
  return createElement(element.tagName.toLowerCase(), { key, ...mapAttributes(element) }, ...children);
}

export function renderSanitizedHtml(value: string): ReactNode {
  if (!value) {
    return '';
  }
  if (typeof DOMParser === 'undefined') {
    return fallbackStripTags(value);
  }

  const sanitized = sanitizeHtml(value);
  const doc = new DOMParser().parseFromString(sanitized, 'text/html');
  const children = Array.from(doc.body.childNodes).map((node, index) =>
    domNodeToReact(node, `safe-html-${index}`),
  );
  return createElement(Fragment, null, ...children);
}

export function extractPlainText(value: string): string {
  if (!value) return '';
  if (typeof DOMParser === 'undefined') return fallbackStripTags(value);

  const sanitized = sanitizeHtml(value);
  const doc = new DOMParser().parseFromString(sanitized, 'text/html');
  return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
}
