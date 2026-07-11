'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Markdown, MarkdownStorage } from 'tiptap-markdown';
import type { Editor } from '@tiptap/core';

function getMarkdown(editor: Editor): string {
  const storage = editor.storage as unknown as { markdown: MarkdownStorage };
  return storage.markdown.getMarkdown();
}

interface Props {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  /** Fires on every change with the current text — lets a parent (e.g. a
   *  full-post preview) stay in sync without turning this into a controlled
   *  input (the underlying textarea still owns `name`/form submission). */
  onChange?: (value: string) => void;
}

// Same stroke-icon convention as components/Sidebar.tsx.
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  undo: <Icon d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-1" />,
  redo: <Icon d="M15 14l5-5-5-5M20 9H9a5 5 0 000 10h1" />,
  bold: <Icon d="M6 4h6a3.5 3.5 0 010 7H6zM6 11h7a3.5 3.5 0 010 7H6z" />,
  italic: <Icon d="M11 4h6M5 20h6M14 4L9 20" />,
  bulletList: <Icon d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  orderedList: <Icon d="M9 6h11M9 12h11M9 18h11M4 6h1v3M4 10h2M4.5 14a1.5 1.5 0 013 0c0 .8-.5 1.2-1 1.7L4 18h3.5" />,
  quote: <Icon d="M4 8a3 3 0 013-3v2a1 1 0 00-1 1v1h2v4H4zM13 8a3 3 0 013-3v2a1 1 0 00-1 1v1h2v4h-4z" />,
  divider: <Icon d="M4 12h16" />,
  link: <Icon d="M9 15l6-6M8 7l1.5-1.5a3.5 3.5 0 015 5L13 12M16 17l-1.5 1.5a3.5 3.5 0 01-5-5L11 12" />,
  image: <Icon d="M4 4h16v16H4zM8.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM20 15l-5-5-9 9" />,
};

export default function MarkdownEditor({ name, defaultValue, placeholder, rows = 8, className, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Markdown.configure({ html: false }),
    ],
    content: defaultValue ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none focus:outline-none',
        style: `min-height: ${rows * 1.6}em`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(getMarkdown(editor));
    },
  });

  const markdown = editor ? getMarkdown(editor) : defaultValue ?? '';

  function setLink() {
    if (!editor) return;
    const url = window.prompt('Link URL');
    if (!url) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  function addImage() {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  type Tool = { icon?: React.ReactNode; label?: string; title: string; action: () => void; active?: boolean; disabled?: boolean };

  const groups: Tool[][] = editor
    ? [
        [
          { icon: icons.undo, title: 'Undo', action: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
          { icon: icons.redo, title: 'Redo', action: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
        ],
        [
          { label: 'H2', title: 'Heading', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
          { label: 'H3', title: 'Sub-heading', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
        ],
        [
          { icon: icons.bold, title: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
          { icon: icons.italic, title: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
        ],
        [
          { icon: icons.bulletList, title: 'Bullet list', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
          { icon: icons.orderedList, title: 'Numbered list', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
        ],
        [
          { icon: icons.quote, title: 'Quote', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
          { icon: icons.divider, title: 'Divider', action: () => editor.chain().focus().setHorizontalRule().run() },
        ],
        [
          { icon: icons.link, title: 'Link', action: setLink, active: editor.isActive('link') },
          { icon: icons.image, title: 'Image', action: addImage },
        ],
      ]
    : [];

  return (
    <div className={`rounded-lg border border-stone-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#c96a3a]/30 focus-within:border-[#c96a3a]/60 ${className ?? ''}`}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-stone-100 bg-stone-50 flex-wrap">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5 pr-1.5 mr-1.5 border-r border-stone-200 last:border-r-0 last:pr-0 last:mr-0">
            {group.map((t) => (
              <button
                key={t.title}
                type="button"
                title={t.title}
                onClick={t.action}
                disabled={t.disabled}
                className={`flex items-center justify-center h-7 min-w-7 px-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-30 disabled:pointer-events-none ${
                  t.active ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {t.icon ?? t.label}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="relative px-3 py-2.5 bg-white text-sm text-stone-800">
        {editor && !editor.getText() && (
          <p className="text-stone-300 italic pointer-events-none absolute">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={markdown} readOnly />
    </div>
  );
}
