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

  const tools: Array<{ label: string; title: string; action: () => void; active?: boolean }> = editor
    ? [
        { label: 'B', title: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
        { label: 'I', title: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
        { label: 'H2', title: 'Heading', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
        { label: 'H3', title: 'Sub-heading', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
        { label: '• List', title: 'Bullet list', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
        { label: '1. List', title: 'Numbered list', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
        { label: '“ ”', title: 'Quote', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
        { label: '—', title: 'Divider', action: () => editor.chain().focus().setHorizontalRule().run() },
        { label: 'Link', title: 'Link', action: setLink, active: editor.isActive('link') },
        { label: 'Image', title: 'Image', action: addImage },
      ]
    : [];

  return (
    <div className={`rounded-lg border border-stone-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#c96a3a]/30 focus-within:border-[#c96a3a]/60 ${className ?? ''}`}>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-stone-100 bg-stone-50 flex-wrap">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            onClick={t.action}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              t.active ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            {t.label}
          </button>
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
