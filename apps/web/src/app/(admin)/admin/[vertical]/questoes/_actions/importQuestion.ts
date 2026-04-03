'use server';

import { createClient } from '@/lib/supabase/server';
import { aiService } from '@/lib/ai/ai-service';
import { stage1ExtractionPrompt, stage2EnrichmentPrompt } from '@/lib/ai/prompts';
import type {
  EnrichedQuestion,
  Stage1Result,
  Stage2Result,
} from '../_components/SuperImporter/types';

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Acesso negado.');
  return { supabase, userId: session.user.id };
}

// ── Stage helper: parse JSON retornado pelo LLM ───────────────────────────────

function parseAiJson<T>(raw: string): T | null {
  // Remove possível markdown code-block que alguns modelos inserem
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ── analyzeWithAI — Pipeline de dois estágios ─────────────────────────────────

/**
 * Executa o pipeline de IA em dois estágios para enriquecer uma questão a partir de imagem.
 * Não escreve nada no banco de dados — apenas retorna os dados para revisão humana.
 *
 * Stage 1: visão (modelo multimodal) → extração do que está visível
 * Stage 2: texto puro (modelo mais barato) → enriquecimento + flashcard
 */
export async function analyzeWithAI(
  imageBase64: string,
  mimeType: string,
  operatorHint: string,
  vertical: string
): Promise<{ ok: true; data: EnrichedQuestion } | { ok: false; error: string }> {
  try {
    await requireAdmin();

    // ── Stage 1: Extração visual ────────────────────────────────
    const s1Response = await aiService.run({
      feature: 'question-parser',
      prompt: stage1ExtractionPrompt(),
      imageBase64,
      mimeType: mimeType || 'image/jpeg',
      maxTokens: 2048,
    });

    const stage1 = parseAiJson<Stage1Result>(s1Response.text);

    if (!stage1) {
      return {
        ok: false,
        error: 'O Stage 1 retornou um formato inválido. Tente novamente ou use uma imagem mais nítida.',
      };
    }

    if (stage1.erro) {
      return { ok: false, error: stage1.erro };
    }

    if (!stage1.enunciado?.trim()) {
      return {
        ok: false,
        error: 'Não foi possível extrair o enunciado da imagem. Verifique se a imagem contém uma questão legível.',
      };
    }

    // ── Stage 2: Enriquecimento e flashcard ────────────────────
    const s2Response = await aiService.run({
      feature: 'question-parser',
      prompt: stage2EnrichmentPrompt(stage1, operatorHint, vertical),
      maxTokens: 1500,
    });

    const stage2 = parseAiJson<Stage2Result>(s2Response.text);

    if (!stage2) {
      return {
        ok: false,
        error: 'O Stage 2 retornou um formato inválido. A extração de metadados falhou.',
      };
    }

    return { ok: true, data: { stage1, stage2 } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido no pipeline de IA.';
    // AiUnavailableError tem mensagem já amigável
    return { ok: false, error: msg };
  }
}

// ── saveImportedQuestion — Salva no banco após revisão humana ─────────────────

export interface SaveImportedPayload {
  vertical: string;
  subjectId: string;
  enunciado: string;
  options: { id: string; text: string; comment?: string }[];
  correctOption: string;
  difficulty: 'easy' | 'medium' | 'hard';
  generalExplanation?: string;
  subcategories: string[];
  year?: number | null;
  examBoard?: string;
  institution?: string;
  examName?: string;
  flashcardFront?: string;
  flashcardBack?: string;
  flashcardHint?: string;
  aiFilledFields: string[];
  aiConfidence: Record<string, number>;
  operatorHint?: string;
}

export async function saveImportedQuestion(
  payload: SaveImportedPayload
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const { supabase } = await requireAdmin();

    if (!payload.subjectId) return { ok: false, error: 'Selecione uma disciplina.' };
    if (!payload.enunciado?.trim()) return { ok: false, error: 'O enunciado é obrigatório.' };
    const filledOptions = payload.options.filter((o) => o.text.trim());
    if (filledOptions.length < 2) return { ok: false, error: 'Preencha ao menos 2 alternativas.' };

    const { data, error } = await supabase
      .from('questions')
      .insert({
        tenant_id: payload.vertical,
        subject_id: payload.subjectId,
        // Envolve em parágrafo HTML para compatibilidade com o RichTextEditor
        text: `<p>${payload.enunciado.replace(/\n/g, '</p><p>')}</p>`,
        options: payload.options.filter((o) => o.text.trim()),
        correct_option: payload.correctOption,
        difficulty: payload.difficulty,
        general_explanation: payload.generalExplanation?.trim() || null,
        subcategories: payload.subcategories,
        subcategory: null,
        year: payload.year ?? null,
        exam_board: payload.examBoard?.trim() || null,
        institution: payload.institution?.trim() || null,
        exam_name: payload.examName?.trim() || null,
        // Flashcard pré-processado
        flashcard_front: payload.flashcardFront?.trim() || null,
        flashcard_back: payload.flashcardBack?.trim() || null,
        flashcard_hint: payload.flashcardHint?.trim() || null,
        // Rastreabilidade da IA
        ai_filled_fields: payload.aiFilledFields,
        ai_confidence: payload.aiConfidence,
        ai_engine_version: 1,
        operator_hint: payload.operatorHint?.trim() || null,
      })
      .select('id')
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
