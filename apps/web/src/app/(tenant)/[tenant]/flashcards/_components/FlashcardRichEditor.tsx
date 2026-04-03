'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useRef, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { generateFlashcardUploadUrl } from '../_actions/generateFlashcardUploadUrl';

// ── FlashcardRichEditor ────────────────────────────────────────────────────────
//
// Lightweight TipTap editor for personal flashcard creation.
// Toolbar: Bold, Italic, Underline, BulletList, Image upload.
// Image uploads go to /${tenant}/flashcards/${userId}/ on R2 (authenticated user,
// no admin check needed). Adapted from admin RichTextEditor.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  tenant: string;
  value: string;
  onChange: (html: string) => void;
  /** Called with the public URL after each successful R2 upload */
  onImageUploaded?: (url: string) => void;
  placeholder?: string;
  minHeight?: number;
  /** Maximum plain-text character count (shown as counter in footer) */
  limit?: number;
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Btn({
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

function Toolbar({
  editor,
  onImageClick,
  imageUploading,
  imageLimitReached,
}: {
  editor: Editor;
  onImageClick: () => void;
  imageUploading: boolean;
  imageLimitReached: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 select-none">
      <Btn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Negrito"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M15.6 11.79A4 4 0 0 0 12 5H6v14h7a4.5 4.5 0 0 0 2.6-8.21zM9 7.5h3a1.5 1.5 0 0 1 0 3H9V7.5zm3.5 9H9v-3h3.5a1.5 1.5 0 0 1 0 3z" />
        </svg>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Itálico"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M10 5v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V5z" />
        </svg>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Sublinhado"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
        </svg>
      </Btn>

      <span className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

      <Btn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Lista"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      </Btn>

      <span className="w-px h-5 bg-slate-200 mx-0.5 shrink-0" />

      <Btn
        onClick={onImageClick}
        disabled={imageUploading || imageLimitReached}
        title={imageLimitReached ? 'Limite: 1 imagem por lado' : imageUploading ? 'Enviando...' : 'Inserir imagem (máx. 250 KB)'}
      >
        {imageUploading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        )}
      </Btn>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countImages(editor: Editor): number {
  let n = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image') n++;
  });
  return n;
}

const MAX_IMAGE_BYTES = 250 * 1024; // 250 KB per image (student quota)
const MAX_IMAGES      = 1;          // 1 image per card side

// ── Main ──────────────────────────────────────────────────────────────────────

export function FlashcardRichEditor({
  tenant,
  value,
  onChange,
  onImageUploaded,
  placeholder = 'Digite aqui...',
  minHeight = 160,
  limit,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const ed = editorRef.current;
      if (!ed) return;
      if (countImages(ed) >= MAX_IMAGES) {
        toast.warning(`Limite atingido: máximo de ${MAX_IMAGES} imagem por lado do flashcard.`);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error('Imagem muito grande — máximo 250 KB. Comprime antes de enviar.');
        return;
      }
      setImageUploading(true);
      try {
        const { uploadUrl, publicUrl } = await generateFlashcardUploadUrl(
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
        // Notify parent so it can track this URL for orphan cleanup on cancel
        onImageUploaded?.(publicUrl);
      } catch (err) {
        console.error('Upload failed:', err);
        toast.error('Erro ao enviar imagem. Verifique sua conexão e tente novamente.');
      } finally {
        setImageUploading(false);
      }
    },
    [tenant, onImageUploaded]
  );

  const uploadFileRef = useRef(uploadFile);
  uploadFileRef.current = uploadFile;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      ImageExtension.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      ...(limit != null ? [CharacterCount.configure({ limit })] : []),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const ed = editorRef.current;
            if (ed && countImages(ed) >= MAX_IMAGES) {
              toast.warning(`Limite atingido: máximo de ${MAX_IMAGES} imagem por lado do flashcard.`);
              return true;
            }
            const file = item.getAsFile();
            if (file) uploadFileRef.current(file);
            return true;
          }
        }
        return false;
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            const ed = editorRef.current;
            if (ed && countImages(ed) >= MAX_IMAGES) {
              toast.warning(`Limite atingido: máximo de ${MAX_IMAGES} imagem por lado do flashcard.`);
              return true;
            }
            uploadFileRef.current(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Reset editor when value is cleared externally
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (!editor) return;
    if (value === '' && prevValueRef.current !== '') {
      editor.commands.setContent('', { emitUpdate: false });
    }
    prevValueRef.current = value;
  }, [value, editor]);

  if (!editor) return null;

  // Compute synchronously from editor state — updated on every re-render
  const imageLimitReached = countImages(editor) >= MAX_IMAGES;
  const charCount = limit != null
    ? (editor.storage.characterCount as { characters: () => number } | undefined)?.characters() ?? 0
    : null;
  const isAtLimit = charCount != null && limit != null && charCount >= limit;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition">
      <Toolbar
        editor={editor}
        onImageClick={() => fileInputRef.current?.click()}
        imageUploading={imageUploading}
        imageLimitReached={imageLimitReached}
      />
      <div style={{ minHeight }} className="px-4 py-3 text-sm text-slate-900">
        <EditorContent editor={editor} />
      </div>
      {limit != null && charCount != null && (
        <div className="flex justify-end px-3 py-1.5 border-t border-slate-100 bg-slate-50">
          <span className={`text-[11px] font-medium tabular-nums ${isAtLimit ? 'text-red-500' : 'text-slate-400'}`}>
            {charCount}/{limit}
          </span>
        </div>
      )}
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
