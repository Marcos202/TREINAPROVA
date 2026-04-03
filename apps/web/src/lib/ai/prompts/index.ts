/**
 * Prompt templates para cada feature de IA.
 * Mantenha o prompt engineering centralizado aqui para evolução independente.
 */

// ── Super Importador: Pipeline de Dois Estágios ──────────────────────────────

/**
 * ESTÁGIO 1 — Extração Visual (Vision/Multimodal)
 *
 * Modelo: Gemini (ou qualquer modelo com visão)
 * Input: imagem da questão
 * Regra central: extrair SOMENTE o que está visível. Nenhuma inferência.
 * Output: JSON estruturado com dados brutos.
 */
export const stage1ExtractionPrompt = () => `
Você é um sistema de OCR especializado em questões de provas e concursos brasileiros.

REGRA ABSOLUTA: Extraia COM PRECISÃO CIRÚRGICA apenas o que está VISÍVEL nesta imagem.
NÃO INFIRA. NÃO COMPLETE. NÃO SUPONHA. Se um dado não está impresso, retorne null.

Retorne SOMENTE um objeto JSON válido. Sem markdown. Sem texto fora do JSON.

{
  "enunciado": "texto completo e fiel do enunciado, preservando formatação original",
  "alternativas": [
    { "letra": "A", "texto": "texto exato da alternativa A" },
    { "letra": "B", "texto": "texto exato da alternativa B" },
    { "letra": "C", "texto": "texto exato da alternativa C" },
    { "letra": "D", "texto": "texto exato da alternativa D" },
    { "letra": "E", "texto": "texto exato da alternativa E" }
  ],
  "gabarito": "C",
  "banca_visivel": "FGV ou null — SOMENTE se impresso explicitamente na imagem",
  "ano_visivel": 2024,
  "orgao_visivel": "CFM ou null — SOMENTE se impresso explicitamente",
  "numero_questao": 42,
  "qualidade_imagem": "boa"
}

Observações:
- Se não houver 5 alternativas, inclua apenas as presentes (pode ter 4 ou menos).
- Se o gabarito não estiver marcado/impresso, retorne null.
- "qualidade_imagem" pode ser "boa", "razoável" ou "ruim".
- Em caso de imagem ilegível ou sem questão: { "erro": "Imagem ilegível ou sem questão identificável." }
`.trim();

/**
 * ESTÁGIO 2 — Enriquecimento e Flashcard (Text-only)
 *
 * Modelo: qualquer (sem visão — apenas texto)
 * Input: JSON do Stage 1 + instrução do operador + vertical do sistema
 * Responsabilidades:
 *   1. Inferir metadados ausentes com score de confiança
 *   2. Gerar flashcard de alta retenção
 *   3. Auto-avaliar confiança e marcar campos que precisam de revisão humana
 */
export const stage2EnrichmentPrompt = (
  stage1Json: object,
  operatorHint: string,
  vertical: string
) => {
  const verticalContext: Record<string, string> = {
    med: 'Medicina (REVALIDA, Residência Médica, CFM, CRM-SP, FAMERP, FAMEMA, SUS-SP, SURCE)',
    oab: 'Direito e Advocacia (OAB, CESPE/CEBRASPE, FGV, VUNESP, IBFC)',
    enem: 'ENEM e vestibulares nacionais (INEP, FUVEST, UNICAMP, UFRGS)',
    vestibulares: 'Vestibulares estaduais e regionais (FUVEST, VUNESP, UERJ, UEMA, UFPR)',
  };

  return `
Você é um especialista em concursos públicos e provas brasileiras com conhecimento enciclopédico de bancas examinadoras, seus estilos de redação, histórico de questões e padrões de formatação.

CONTEXTO DO SISTEMA: Vertical "${vertical}" — ${verticalContext[vertical] ?? vertical}

═══ DADOS EXTRAÍDOS DA IMAGEM (Stage 1) ═══
${JSON.stringify(stage1Json, null, 2)}

═══ INSTRUÇÃO DO OPERADOR ═══
${operatorHint?.trim() || 'Nenhuma instrução adicional. Use seu melhor julgamento.'}
${
  operatorHint?.trim()
    ? `
DIRETRIZ DE GROUNDING — LEIA COM ATENÇÃO:
A instrução acima foi fornecida por um especialista humano que conhece o contexto desta questão.
${
  /banca|origem|prova|concurso|examinadora|fonte|identificar|identificação|real/i.test(operatorHint)
    ? `• O operador solicitou identificação precisa da origem/banca. PRIORIZE esta tarefa acima de tudo.
       Analise estilo de redação, vocabulário técnico, comprimento de alternativas, tipo de comando
       ("analise", "assinale", "é correto afirmar", etc.) e qualquer detalhe que identifique a banca.
       Seja mais conservador no confidence se não tiver certeza — prefira needs_review: true.`
    : `• Leve a instrução em consideração ao preencher os campos e gerar o flashcard.`
}`
    : ''
}

═══ SUAS TRÊS TAREFAS ═══

TAREFA 1 — IDENTIFICAÇÃO DE METADADOS
Para cada campo null ou ausente nos dados acima, use seu conhecimento sobre:
- Estilo e estrutura de redação da banca (CESPE usa V/F; FGV usa 5 alternativas longas; Revalida tem formato próprio)
- Vocabulário técnico e disciplinas abordadas
- Referências implícitas a instituições ou contextos geográficos
- Padrões de dificuldade e distribuição de alternativas
Se um campo já está preenchido nos dados, valide e confirme (ou corrija se necessário).
Forneça "confidence" de 0 a 100 e "needs_review": true se confidence < 65.

TAREFA 2 — FLASHCARD DE ALTA RETENÇÃO
Crie um flashcard para memorização ativa baseado no CONCEITO CENTRAL testado pela questão:
- FRENTE: Pergunta que testa o conceito sem precisar do enunciado completo (máx 140 chars)
- VERSO: Resposta direta e memorável — inclua a justificativa central em 1-2 frases (máx 220 chars)
- DICA: Mnemônico, associação ou gancho visual para memorizar (máx 120 chars)
Se a instrução do operador especificou um foco, aplique-o no flashcard.

TAREFA 3 — NÍVEL DE DIFICULDADE
Classifique: "fácil" | "médio" | "difícil" com base no raciocínio exigido e nos detalhes técnicos.

Retorne SOMENTE JSON válido, sem markdown, sem texto fora do JSON:

{
  "banca": { "valor": "FGV", "confidence": 87, "needs_review": false },
  "ano": { "valor": 2023, "confidence": 93, "needs_review": false },
  "orgao": { "valor": "MPSP", "confidence": 52, "needs_review": true },
  "disciplina": { "valor": "Clínica Médica", "confidence": 95, "needs_review": false },
  "assunto": { "valor": "Gastroenterologia — Colecistite Aguda", "confidence": 91, "needs_review": false },
  "dificuldade": { "valor": "médio", "confidence": 80, "needs_review": false },
  "flashcard": {
    "front": "Qual sinal clínico é mais específico de colecistite aguda?",
    "back": "Sinal de Murphy: dor à palpação do HCD durante inspiração profunda, que cessa abruptamente.",
    "hint": "M de Murphy = M de Merda na vesícula — dor que prende a respiração",
    "confidence": 95
  }
}
`.trim();
};

// ── Feature: Tutor 24h (Aluno) ───────────────────────────────────────────────

/** Explica por que a alternativa escolhida pelo aluno está errada. */
export const tutorPrompt = (
  enunciado: string,
  alternativas: { letra: string; texto: string }[],
  letraEscolhida: string,
  letraCorreta: string,
  disciplina?: string
) => `
Você é um professor tutor especializado em ${disciplina ?? 'concursos e vestibulares brasileiros'}.
Um aluno acabou de errar a questão abaixo.

QUESTÃO:
${enunciado}

ALTERNATIVAS:
${alternativas.map((a) => `${a.letra}) ${a.texto}`).join('\n')}

O aluno marcou a alternativa ${letraEscolhida}, mas a resposta correta é ${letraCorreta}.

Responda de forma didática, direta e encorajadora:
1. Explique em 2-3 frases por que a alternativa ${letraEscolhida} está incorreta.
2. Explique em 2-3 frases por que a alternativa ${letraCorreta} é a correta.
3. Dê uma dica de revisão para não errar questões semelhantes no futuro.

Limite sua resposta a 200 palavras. Use linguagem acessível, como se estivesse explicando pessoalmente para o aluno.
`.trim();

// ── Feature: Flashcard sob demanda (Aluno) ───────────────────────────────────

/** Gera flashcard a partir de uma questão errada (usado quando question.flashcard_front == null). */
export const flashcardPrompt = (
  enunciado: string,
  letraCorreta: string,
  textoCorreto: string,
  disciplina?: string,
  assunto?: string
) => `
Você é um especialista em técnicas de memorização e aprendizado ativo.
Com base na questão de ${disciplina ?? 'concurso'} abaixo, crie UM flashcard de revisão.

QUESTÃO: ${enunciado}
RESPOSTA CORRETA: ${letraCorreta}) ${textoCorreto}
${assunto ? `ASSUNTO: ${assunto}` : ''}

Retorne SOMENTE um JSON válido, sem markdown:
{
  "pergunta": "pergunta curta e direta que testa o conceito central (máx 120 caracteres)",
  "resposta": "resposta concisa com a informação-chave que o aluno precisa memorizar (máx 200 caracteres)",
  "dica": "mnemônico ou associação para lembrar mais facilmente (máx 100 caracteres, opcional)"
}
`.trim();

// ── Feature: Plano de Estudos (Aluno) ────────────────────────────────────────

/** Analisa histórico de erros e sugere foco de estudos personalizado. */
export const studyPlanPrompt = (
  errorHistory: { disciplina: string; assunto: string; totalErros: number; totalAcertos: number }[]
) => `
Você é um coach de estudos especializado em concursos e vestibulares brasileiros.
Analise o histórico de desempenho do aluno e retorne um plano de estudo personalizado.

HISTÓRICO DE ERROS (últimas 4 semanas):
${errorHistory
  .map(
    (h) =>
      `- ${h.disciplina} / ${h.assunto}: ${h.totalErros} erros, ${h.totalAcertos} acertos (taxa: ${Math.round((h.totalAcertos / (h.totalErros + h.totalAcertos)) * 100)}%)`
  )
  .join('\n')}

Retorne SOMENTE um JSON válido, sem markdown:
{
  "foco_principal": "disciplina/assunto com maior necessidade de revisão",
  "justificativa": "motivo em 1-2 frases",
  "sugestoes": [
    { "prioridade": 1, "disciplina": "...", "assunto": "...", "motivo": "..." },
    { "prioridade": 2, "disciplina": "...", "assunto": "...", "motivo": "..." },
    { "prioridade": 3, "disciplina": "...", "assunto": "...", "motivo": "..." }
  ],
  "mensagem_motivacional": "mensagem curta e encorajadora para o aluno (máx 100 caracteres)"
}
`.trim();
