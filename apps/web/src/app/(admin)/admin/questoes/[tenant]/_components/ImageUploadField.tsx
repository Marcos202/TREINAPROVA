'use client';

import { useRef, useState } from 'react';
import { generateUploadUrl } from '../_actions/uploadImage';

interface Props {
  tenant: string;
  value: string;
  onChange: (url: string) => void;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_SIZE_MB = 5;

export function ImageUploadField({ tenant, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Imagem deve ter no máximo ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    try {
      const { uploadUrl, publicUrl } = await generateUploadUrl(
        tenant,
        file.name,
        file.type
      );

      // Upload direto ao R2 sem passar pelo servidor Next.js
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!res.ok) throw new Error(`Upload falhou: HTTP ${res.status}`);

      onChange(publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Imagem da questão"
            className="w-full max-h-64 object-contain rounded-md border border-slate-200 bg-slate-50 p-2"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          >
            Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-28 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="text-sm text-slate-500">Enviando...</span>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Clique para adicionar imagem</span>
              <span className="text-xs">JPG, PNG, WEBP, GIF — máx. {MAX_SIZE_MB}MB</span>
            </>
          )}
        </button>
      )}

      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : '↺ Trocar imagem'}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // reset para permitir re-upload do mesmo arquivo
          e.target.value = '';
        }}
      />
    </div>
  );
}
