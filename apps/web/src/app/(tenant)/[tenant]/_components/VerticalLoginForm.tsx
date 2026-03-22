'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TENANT_ACCENT_COLORS } from '@/config/tenants';

interface VerticalLoginFormProps {
  tenant: string;
  tenantLabel: string;
  redirectTo: string;
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'E-mail ainda não foi confirmado.',
  'User already registered': 'Este e-mail já possui uma conta cadastrada.',
  'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres.',
  'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
  'Signup requires a valid password': 'É necessário informar uma senha válida.',
};

function translateError(message: string): string {
  return ERROR_TRANSLATIONS[message] || message;
}

export default function VerticalLoginForm({ tenant, tenantLabel, redirectTo }: VerticalLoginFormProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const accentColor = TENANT_ACCENT_COLORS[tenant] ?? 'bg-slate-900 hover:bg-slate-800';

  const handleSubmit = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.preventDefault();

    if (!isLoginMode && !fullName.trim()) {
      setErrorMsg('O nome completo é obrigatório.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const supabase = createClient();

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(translateError(error.message));
          setIsLoading(false);
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
          return;
        }
      }

      // Redirecionar para o destino após auth bem-sucedida
      window.location.replace(redirectTo);
    } catch (ex: unknown) {
      const message = ex instanceof Error ? ex.message : 'Erro inesperado.';
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoginMode((prev) => !prev);
    setErrorMsg('');
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          {isLoginMode ? `Entrar em ${tenantLabel}` : 'Criar Nova Conta'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isLoginMode
            ? 'Use suas credenciais para acessar a plataforma.'
            : 'Preencha os dados abaixo para criar sua conta.'}
        </p>
      </div>

      {/* Card do Formulário */}
      <div className="border border-slate-200 rounded-lg p-8 bg-white">
        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Campo Nome Completo (apenas Cadastro) */}
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

        {/* Campo E-mail */}
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
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Campo Senha */}
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
            className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Botão Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full py-2.5 px-4 text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${accentColor}`}
        >
          {isLoading
            ? 'Processando...'
            : isLoginMode
              ? 'Entrar'
              : 'Criar Conta'}
        </button>

        {/* Toggle Login/Cadastro */}
        <div className="text-center mt-5">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            {isLoginMode
              ? 'Não possui conta? Crie uma agora.'
              : 'Já possui uma conta? Faça login.'}
          </button>
        </div>
      </div>
    </div>
  );
}
