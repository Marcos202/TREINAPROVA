"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const translateError = (message: string): string => {
    const translations: Record<string, string> = {
      "Invalid login credentials": "E-mail ou senha incorretos.",
      "Email not confirmed": "E-mail ainda não foi confirmado.",
      "User already registered": "Este e-mail já possui uma conta cadastrada.",
      "Password should be at least 6 characters":
        "A senha deve ter no mínimo 6 caracteres.",
      "Unable to validate email address: invalid format":
        "Formato de e-mail inválido.",
      "Signup requires a valid password":
        "É necessário informar uma senha válida.",
    };
    return translations[message] || message;
  };

  const handleSubmit = async (e?: any) => {
    e?.preventDefault();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[1/10] 🔥 Clique interceptado com sucesso!");
    console.log("[2/10] 🔍 hostname:", window.location.hostname);
    console.log("[2/10] 🔍 isLocalhost check:", window.location.hostname.includes('localhost'));
    console.log("[2/10] 🔍 Cookie domain SERÁ:", window.location.hostname.includes('localhost') ? '.localhost' : '.treinaprova.com');
    console.log("[3/10] Modo:", isLoginMode ? "LOGIN" : "CADASTRO");
    console.log("[3/10] Email:", email, "| Password length:", password.length);

    // Validação de nome no modo cadastro
    if (!isLoginMode && !fullName.trim()) {
      console.log("[ABORT] Nome vazio no modo cadastro.");
      setErrorMsg("O nome completo é obrigatório.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    console.log("[4/10] isLoading = true. Criando client Supabase...");

    const supabase = createClient();
    console.log("[5/10] Client Supabase criado. Disparando chamada auth...");

    try {
      if (isLoginMode) {
        // ── LOGIN ──
        console.log("[6/10] Chamando signInWithPassword...");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log("[7/10] signInWithPassword RETORNOU.");
        console.log("[7/10] error:", error);
        console.log("[7/10] data.user:", data?.user?.email || "null");
        console.log("[7/10] data.session:", data?.session ? "EXISTE" : "NULL");

        if (error) {
          console.log("[ABORT] Erro do Supabase:", error.message);
          setErrorMsg(translateError(error.message));
          alert("❌ ERRO SUPABASE: " + error.message);
          setIsLoading(false);
          return;
        }
      } else {
        // ── CADASTRO ──
        console.log("[6/10] Chamando signUp...");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        console.log("[7/10] signUp RETORNOU.");
        console.log("[7/10] error:", error);
        console.log("[7/10] data.user:", data?.user?.email || "null");
        console.log("[7/10] data.session:", data?.session ? "EXISTE" : "NULL");

        if (error) {
          console.log("[ABORT] Erro do Supabase:", error.message);
          setErrorMsg(translateError(error.message));
          alert("❌ ERRO SUPABASE: " + error.message);
          setIsLoading(false);
          return;
        }
      }

      // Sucesso em ambos os fluxos
      console.log("[8/10] ✅ Auth concluída SEM ERRO!");
      console.log("[9/10] Verificando cookies AGORA:", document.cookie);
      console.log("[10/10] Tentando redirecionar para /aluno...");
      // Força navegação completa (replace impede voltar ao login pelo botão "voltar")
      window.location.replace('/aluno');
    } catch (ex: any) {
      console.error("[CATCH] ❌ EXCEÇÃO NÃO TRATADA:", ex);
      alert("❌ EXCEÇÃO JAVASCRIPT: " + ex?.message);
      setIsLoading(false);
    }
  };

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoginMode((prev) => !prev);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {isLoginMode ? "Entrar na Treina Prova" : "Criar Nova Conta"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isLoginMode
              ? "Use suas credenciais para acessar a plataforma."
              : "Preencha os dados abaixo para criar sua conta."}
          </p>
        </div>

        {/* Card do Formulário */}
        <div
          className="border border-slate-200 rounded-lg p-8 bg-white"
        >
          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Campo Nome Completo (apenas Cadastro) */}
          {!isLoginMode && (
            <div className="mb-4">
              <label
                htmlFor="fullName"
                className="block mb-1.5 text-sm font-medium text-slate-700"
              >
                Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Campo E-mail */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block mb-1.5 text-sm font-medium text-slate-700"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Campo Senha */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block mb-1.5 text-sm font-medium text-slate-700"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Botão Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-2.5 px-4 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading
              ? "Processando..."
              : isLoginMode
                ? "Entrar"
                : "Criar Conta"}
          </button>

          {/* Toggle Login/Cadastro */}
          <div className="text-center mt-5">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              {isLoginMode
                ? "Não possui conta? Crie uma agora."
                : "Já possui uma conta? Faça login."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
