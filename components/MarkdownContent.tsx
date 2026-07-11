import { marked } from 'marked';

interface Props {
  content: string;
  className?: string;
}

// Same rendering as the storefront's MarkdownContent (marked, GFM + line
// breaks) — this preview should look like what the storefront will actually
// produce, not an approximation.
marked.setOptions({ breaks: true, gfm: true });

export default function MarkdownContent({ content, className }: Props) {
  if (!content?.trim()) return null;
  const html = marked.parse(content, { async: false }) as string;
  return (
    <div
      className={`prose prose-stone max-w-none ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
