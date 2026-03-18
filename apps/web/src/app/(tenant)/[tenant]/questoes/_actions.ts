"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function seedQuestions(tenant: string) {
  const supabase = await createClient();

  // 1. Ensure a subject exists for this tenant
  const { data: existingSubjects } = await supabase
    .from("subjects")
    .select("id")
    .eq("tenant_id", tenant)
    .limit(1);

  let subjectId: string;

  if (existingSubjects && existingSubjects.length > 0) {
    subjectId = existingSubjects[0].id;
  } else {
    const { data: newSubject, error: subjectError } = await supabase
      .from("subjects")
      .insert({ tenant_id: tenant, name: "Conhecimentos Gerais" })
      .select("id")
      .single();

    if (subjectError || !newSubject) {
      return { error: subjectError?.message || "Erro ao criar disciplina." };
    }
    subjectId = newSubject.id;
  }

  // 2. Check if questions already exist
  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant);

  if (count && count > 0) {
    return { error: "Já existem questões cadastradas para este tenant." };
  }

  // 3. Insert seed questions
  const seedData = [
    {
      tenant_id: tenant,
      subject_id: subjectId,
      text: "Qual é a principal função do sistema circulatório no corpo humano?",
      options: {
        a: "Digestão de alimentos",
        b: "Transporte de oxigênio e nutrientes",
        c: "Produção de hormônios",
        d: "Proteção contra patógenos",
      },
      correct_option: "b",
      difficulty: "easy" as const,
    },
    {
      tenant_id: tenant,
      subject_id: subjectId,
      text: "Em relação à Constituição Federal de 1988, qual princípio garante que ninguém será obrigado a fazer ou deixar de fazer alguma coisa senão em virtude de lei?",
      options: {
        a: "Princípio da Igualdade",
        b: "Princípio da Legalidade",
        c: "Princípio da Publicidade",
        d: "Princípio da Moralidade",
      },
      correct_option: "b",
      difficulty: "medium" as const,
    },
    {
      tenant_id: tenant,
      subject_id: subjectId,
      text: "Considere a reação de equilíbrio: N₂(g) + 3H₂(g) ⇌ 2NH₃(g). Ao aumentar a pressão do sistema, o equilíbrio se desloca para qual direção?",
      options: {
        a: "Para a esquerda, favorecendo os reagentes",
        b: "Para a direita, favorecendo os produtos",
        c: "Não se altera",
        d: "Depende da temperatura",
      },
      correct_option: "b",
      difficulty: "hard" as const,
    },
  ];

  const { error: insertError } = await supabase
    .from("questions")
    .insert(seedData);

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/${tenant}/questoes`);
  return { success: true };
}
