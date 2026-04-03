"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Ref síncrono — previne múltiplas requisições mesmo antes do React re-renderizar
  const isSubmitting = useRef(false);

  const translateError = (message: string): string => {
    const map: Record<string, string> = {
      "Invalid login credentials":            "E-mail ou senha incorretos.",
      "Email not confirmed":                  "E-mail não confirmado. Verifique sua caixa de entrada.",
      "User already registered":              "Este e-mail já possui conta cadastrada.",
      "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
      "Unable to validate email address: invalid format": "Formato de e-mail inválido.",
      "Signup requires a valid password":     "Informe uma senha válida.",
      "Request rate limit reached":           "Muitas tentativas recentes. Aguarde 1 hora e tente novamente, ou use outra rede.",
      "over_email_send_rate_limit":           "Limite de e-mails atingido. Aguarde e tente novamente.",
      "Too many requests":                    "Muitas tentativas. Aguarde alguns minutos.",
    };
    return map[message] ?? message;
  };

  const handleSubmit = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();

    // Guarda síncrono — impede duplo clique antes do React re-renderizar
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    if (!isLoginMode && !fullName.trim()) {
      setErrorMsg("O nome completo é obrigatório.");
      isSubmitting.current = false;
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    const supabase = createClient();

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(translateError(error.message));
          setIsLoading(false);
          isSubmitting.current = false;
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) {
          setErrorMsg(translateError(error.message));
          setIsLoading(false);
          isSubmitting.current = false;
          return;
        }
      }

      // Sucesso — navegação completa para /aluno
      window.location.replace("/aluno");
    } catch (ex: unknown) {
      const msg = ex instanceof Error ? ex.message : "Erro inesperado. Tente novamente.";
      setErrorMsg(msg);
      setIsLoading(false);
      isSubmitting.current = false;
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

        <div className="border border-slate-200 rounded-lg p-8 bg-white">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-md mb-4 text-sm leading-relaxed">
              {errorMsg}
            </div>
          )}

          {!isLoginMode && (
            <div className="mb-4">
              <label htmlFor="fullName" className="block mb-1.5 text-sm font-medium text-slate-700">
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

          <div className="mb-4">
            <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              autoComplete="email"
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isLoginMode ? "current-password" : "new-password"}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-2.5 px-4 text-sm font-medium rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processando..." : isLoginMode ? "Entrar" : "Criar Conta"}
          </button>

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
