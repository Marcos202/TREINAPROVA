'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useRef, useState, useEffect, useCallback } from 'react';
import { generateUploadUrl } from '../_actions/uploadImage';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  tenant: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// ─── Toolbar primitives ───────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent editor from losing focus on toolbar click
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={
        'inline-flex items-center justify-center w-7 h-7 rounded text-sm transition-colors ' +
        (active
          ? 'bg-slate-900 text-white'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900') +
        (disabled ? ' opacity-40 cursor-not-allowed pointer-events-none' : '')
      }
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />;
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({
  editor,
  onImageClick,
  imageUploading,
}: {
  editor: Editor;
  onImageClick: () => void;
  imageUploading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 select-none">
      {/* Headings */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Título (H2)"
      >
        <span className="font-bold text-xs">H2</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Subtítulo (H3)"
      >
        <span className="font-bold text-xs">H3</span>
      </ToolbarBtn>

      <Divider />

      {/* Text formatting */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Negrito (Ctrl+B)"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M15.6 11.79A4 4 0 0 0 12 5H6v14h7a4.5 4.5 0 0 0 2.6-8.21zM9 7.5h3a1.5 1.5 0 0 1 0 3H9V7.5zm3.5 9H9v-3h3.5a1.5 1.5 0 0 1 0 3z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Itálico (Ctrl+I)"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M10 5v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V5z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Sublinhado (Ctrl+U)"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Tachado"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M6.85 7.08C6.85 4.37 9.45 3 12.24 3c1.64 0 3 .49 3.9 1.28.77.65 1.46 1.73 1.46 3.24h-3.01c0-.31-.05-.58-.15-.8-.29-.65-1.011-.99-2.14-.99-1.31 0-2.27.52-2.27 1.61 0 .79.507 1.26 1.65 1.56l1.34.32c.75.18 1.44.46 2.04.81H6v2h12v-2H13.1c.06.25.1.5.1.78 0 2.57-2.46 4.19-5.15 4.19-2.17 0-3.73-.74-4.68-1.74-.87-.9-1.27-2-1.27-3.14zM5 19h14v-2H5v2z"/>
        </svg>
      </ToolbarBtn>

      <Divider />

      {/* Lists */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Lista com marcadores"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Lista numerada"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
        </svg>
      </ToolbarBtn>

      <Divider />

      {/* Link */}
      <ToolbarBtn
        onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
          } else {
            const url = window.prompt('URL do link:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        active={editor.isActive('link')}
        title="Inserir / remover link"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
      </ToolbarBtn>

      {/* Image upload */}
      <ToolbarBtn
        onClick={onImageClick}
        disabled={imageUploading}
        title={imageUploading ? 'Enviando imagem...' : 'Inserir imagem'}
      >
        {imageUploading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity=".25"/>
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        )}
      </ToolbarBtn>

      <Divider />

      {/* Undo / Redo */}
      <ToolbarBtn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Desfazer (Ctrl+Z)"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
        </svg>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Refazer (Ctrl+Y)"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
        </svg>
      </ToolbarBtn>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RichTextEditor({
  tenant,
  value,
  onChange,
  placeholder = 'Digite aqui...',
  minHeight = 200,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Keep a stable ref to the editor so paste/drop handlers can access it
  // without being recreated on every render.
  const editorRef = useRef<Editor | null>(null);

  // Stable upload function — uses editorRef so it never goes stale
  const uploadFile = useCallback(
    async (file: File) => {
      const ed = editorRef.current;
      if (!ed) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('Imagem deve ter no máximo 5MB.');
        return;
      }

      setImageUploading(true);
      try {
        const { uploadUrl, publicUrl } = await generateUploadUrl(
          tenant,
          file.name,
          file.type
        );
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        ed.chain().focus().setImage({ src: publicUrl, alt: file.name }).run();
      } catch (err) {
        console.error('R2 image upload failed:', err);
        alert('Erro ao enviar imagem. Tente novamente.');
      } finally {
        setImageUploading(false);
      }
    },
    [tenant]
  );

  // Stable ref to uploadFile so handlePaste closure never goes stale
  const uploadFileRef = useRef(uploadFile);
  uploadFileRef.current = uploadFile;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      ImageExtension.configure({ inline: false, allowBase64: false }),
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Treat empty editor as empty string to keep form state clean
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: {
        spellcheck: 'true',
      },
      handlePaste(_, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) uploadFileRef.current(file);
            return true;
          }
        }
        return false;
      },
      handleDrop(_, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            uploadFileRef.current(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  // Keep editorRef in sync
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Sync external resets (e.g. when form clears after save)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (!editor) return;
    // Only force-update editor when value is reset to empty externally
    if (value === '' && prevValueRef.current !== '') {
      editor.commands.setContent('', false);
    }
    prevValueRef.current = value;
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition">
      <Toolbar
        editor={editor}
        onImageClick={() => fileInputRef.current?.click()}
        imageUploading={imageUploading}
      />

      {/* Editor content area */}
      <div style={{ minHeight }} className="px-4 py-3 text-sm text-slate-900">
        <EditorContent editor={editor} />
      </div>

      {/* Hidden file input for image toolbar button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
