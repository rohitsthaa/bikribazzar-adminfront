'use client';
import { useState } from 'react';
import MarkdownEditor from '@/components/MarkdownEditor';

export default function TestEditorPage() {
  const [val, setVal] = useState('');
  return (
    <div style={{ padding: 40, maxWidth: 700 }}>
      <h1>Scratch test page — delete after verifying</h1>
      <MarkdownEditor name="body" defaultValue={'Hello.'} onChange={setVal} placeholder="Tell your story…" rows={8} />
      <pre data-testid="markdown-output" style={{ marginTop: 20, whiteSpace: 'pre-wrap' }}>{val}</pre>
    </div>
  );
}
