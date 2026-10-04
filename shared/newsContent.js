export function parseNewsContent(value = '') {
  const sections = [];
  let current;
  for (const line of value.split('\n')) {
    const text = line.trim();
    if (!text) continue;
    if (text.startsWith('# ') || !current) {
      current = { heading: text.startsWith('# ') ? text.slice(2) : '', paragraphs: [], bullets: [] };
      sections.push(current);
      if (text.startsWith('# ')) continue;
    }
    if (text.startsWith('- ')) current.bullets.push(text.slice(2));
    else current.paragraphs.push(text);
  }
  return sections;
}
export function formatNewsContent(sections = []) {
  return sections.map((s) => [s.heading ? `# ${s.heading}` : '', ...(s.paragraphs || []), ...(s.bullets || []).map((b) => `- ${b}`)].filter(Boolean).join('\n\n')).join('\n\n');
}
export const NEWS_CATEGORIES = ['Thị trường việc làm', 'Hướng dẫn CV', 'Phỏng vấn', 'Kỹ năng nghề nghiệp'];
export const NEWS_CONTENT_LIMIT = 3 * 1024 * 1024;

export function isNewsImageSource(value = '') {
  return /^https?:\/\/[^\s]+$/i.test(value) || /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/]+=*$/i.test(value);
}

const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function newsSectionsToHtml(sections = []) {
  return sections.map((section) => [
    section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : '',
    ...(section.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`),
    section.bullets?.length ? `<ul>${section.bullets.map((text) => `<li><p>${escapeHtml(text)}</p></li>`).join('')}</ul>` : '',
  ].join('')).join('');
}
