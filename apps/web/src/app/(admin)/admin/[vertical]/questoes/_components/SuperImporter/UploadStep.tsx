'use client';

import { useRef, useState } from 'react';

interface Props {
  onAnalyze: (imageBase64: string, mimeType: string, operatorHint: string) => void;
  isLoading: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function UploadStep({ onAnalyze, isLoading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [operatorHint, setOperatorHint] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  function processFile(f: File) {
    setFileError(null);
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError('Formato não suportado. Use JPEG, PNG, WEBP ou GIF.');
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setFileError('Arquivo muito grande. Máximo: 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // dataUrl = "data:image/jpeg;base64,/9j/4AA..."
      // Precisamos só da parte base64
      setPreview(dataUrl);
    };
    reader.readAsDataURL(f);
    setFile(f);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  function handleAnalyze() {
    if (!file || !preview) return;
    // Extrai a parte base64 do dataURL (remove o prefixo "data:image/jpeg;base64,")
    const base64 = preview.split(',')[1];
    onAnalyze(base64, file.type, operatorHint);
  }

  return (
    <div className="space-y-6">

      {/* ── Drop zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-slate-900 bg-slate-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
        } ${preview ? 'p-4' : 'p-10'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          /* ── Preview da imagem carregada ── */
          <div className="w-full flex items-start gap-4">
            <img
              src={preview}
              alt="Preview da questão"
              className="h-32 object-contain rounded-lg border border-slate-200 shrink-0 bg-white"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{file?.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {file ? (file.size / 1024).toFixed(0) : 0} KB • {file?.type}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                  setFileError(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="mt-2 text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Remover e escolher outro
              </button>
            </div>
          </div>
        ) : (
          /* ── Estado vazio ── */
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <UploadIcon className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Arraste a imagem da questão aqui
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ou clique para selecionar um arquivo
            </p>
            <p className="text-[11px] text-slate-300 mt-3">
              JPEG, PNG, WEBP — máximo 10 MB
            </p>
          </div>
        )}
      </div>

      {fileError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {fileError}
        </p>
      )}

      {/* ── Instrução para a IA ── */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Instruções para a IA
          <span className="ml-1.5 text-xs font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          rows={3}
          value={operatorHint}
          onChange={(e) => setOperatorHint(e.target.value)}
          placeholder={
            'Ex: "Esta questão é da banca FGV de 2022. Gere um flashcard focado em diagnóstico diferencial." ' +
            'ou "Ignore o cabeçalho impresso — ele pertence à prova anterior."'
          }
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
        />
        <p className="text-[11px] text-slate-400 mt-1.5">
          Use este campo para dar contexto extra ou corrigir informações que a IA pode não ver na imagem.
        </p>
      </div>

      {/* ── CTA ── */}
      <button
        onClick={handleAnalyze}
        disabled={!file || isLoading}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <SparklesIcon className="w-4 h-4 shrink-0" />
        Analisar e Preencher com IA
      </button>
    </div>
  );
}

/* ── Icons ── */
function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
