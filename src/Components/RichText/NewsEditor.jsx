import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Compressor from 'compressorjs';
import { PhotoIcon, LinkIcon } from '@heroicons/react/24/outline';
import MenuBar from './MenuBar.jsx';
import { isNewsImageSource, NEWS_CONTENT_LIMIT } from '../../../shared/newsContent.js';
import './styles.scss';
import './news.scss';

const compressImage = (file) => new Promise((resolve, reject) => {
  new Compressor(file, {
    maxWidth: 1600, maxHeight: 1600, quality: 0.8, convertSize: 500000,
    success(blob) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Không thể đọc hình ảnh.'));
      reader.readAsDataURL(blob);
    },
    error: () => reject(new Error('Không thể xử lý hình ảnh. Vui lòng chọn tệp khác.')),
  });
});

export default function NewsEditor({ content, onChange, onBusyChange, disabled = false }) {
  const fileInput = useRef(null);
  const insertionPosition = useRef(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image.configure({ allowBase64: true })],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { role: 'textbox', 'aria-label': 'Nội dung bài viết', 'aria-multiline': 'true', class: 'news-rich-text focus:outline-none' },
    },
  });
  useEffect(() => { if (editor && !editor.isDestroyed) editor.setEditable(!disabled && !uploading); }, [editor, disabled, uploading]);
  const insert = (src, description) => {
    if (!editor || editor.isDestroyed) return;
    if (new Blob([editor.getHTML(), src]).size > NEWS_CONTENT_LIMIT) throw new Error('Nội dung và ảnh vượt quá 3 MB.');
    editor.chain().focus().setTextSelection(Math.min(insertionPosition.current ?? editor.state.selection.from, editor.state.doc.content.size)).setImage({ src, alt: description }).run();
    insertionPosition.current = null;
  };
  const upload = async (file) => {
    if (!file) return;
    setError('');
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Chọn ảnh PNG, JPG, WebP hoặc GIF, tối đa 5 MB.'); return;
    }
    setUploading(true); onBusyChange(true);
    editor?.setEditable(false);
    try { insert(await compressImage(file), file.name.replace(/\.[^.]+$/, '')); }
    catch (err) { setError(err.message); }
    finally { if (!editor?.isDestroyed) editor?.setEditable(true); setUploading(false); onBusyChange(false); }
  };
  const iconClass = 'flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-40';
  return <div className="news-editor overflow-hidden rounded-lg border border-slate-300 bg-white">
    {editor && <MenuBar editor={editor} />}
    <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1">
      <button type="button" disabled={disabled || uploading || !editor} title="Chèn ảnh từ máy" aria-label="Chèn ảnh từ máy" className={iconClass} onClick={() => { insertionPosition.current = editor.state.selection.from; fileInput.current.click(); }}><PhotoIcon className="size-5" /></button>
      <button type="button" disabled={disabled || uploading || !editor} title="Chèn ảnh từ đường dẫn" aria-label="Chèn ảnh từ đường dẫn" className={iconClass} onClick={() => { insertionPosition.current = editor.state.selection.from; setShowUrl(!showUrl); setError(''); }}><LinkIcon className="size-5" /></button>
      {uploading && <span role="status" className="px-2 text-xs text-slate-500">Đang xử lý ảnh...</span>}
      <input ref={fileInput} type="file" name="news-image" aria-label="Chọn ảnh bài viết" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void upload(file); }} />
    </div>
    {showUrl && <div className="space-y-3 border-b border-slate-200 bg-slate-50 p-3">
      <label className="block text-xs font-medium">Đường dẫn ảnh<input type="url" name="news-image-url" value={url} onChange={(event) => setUrl(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
      <label className="block text-xs font-medium">Mô tả ảnh<input name="news-image-alt" value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={250} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2" /></label>
      <button type="button" className="rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => {
        try {
          if (!isNewsImageSource(url.trim()) || !/^https?:\/\//i.test(url.trim())) throw new Error('Vui lòng nhập đường dẫn ảnh HTTP hoặc HTTPS hợp lệ.');
          insert(url.trim(), alt.trim()); setShowUrl(false); setUrl(''); setAlt(''); setError('');
        } catch (err) { setError(err.message); }
      }}>Chèn ảnh</button>
    </div>}
    {error && <p role="alert" className="px-4 py-2 text-sm text-red-700">{error}</p>}
    <EditorContent editor={editor} />
  </div>;
}
