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
