'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label, InputGroup } from '@/components/ui';
import { IconMail, IconLock, IconUser, IconEye, IconEyeOff } from '@/components/ui/icons';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(traduzErroSupabase(signUpError.message));
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="bg-surface border border-border-soft rounded-[20px] p-[28px] text-center">
        <div className="w-14 h-14 rounded-full bg-neon/15 flex items-center justify-center mx-auto mb-4">
          <IconMail className="w-6 h-6 text-neon" />
        </div>
        <h1 className="font-display text-[20px] font-bold mb-2">Confirme seu e-mail</h1>
        <p className="text-text-3 text-[13.5px] mb-6 leading-relaxed">
          Enviamos um link de confirmação para <strong className="text-text-1">{email}</strong>. Clique no link recebido para ativar sua conta e fazer login.
        </p>
        <Link href="/login">
          <Button variant="ghost" className="w-full">Voltar para o login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-soft rounded-[20px] p-[28px]">
      <h1 className="font-display text-[22px] font-bold mb-1">Criar sua conta</h1>
      <p className="text-text-3 text-[13.5px] mb-6">Comece a controlar seus investimentos gratuitamente</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputGroup>
          <Label>Nome</Label>
          <div className="relative">
            <IconUser className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" required className="pl-10" />
          </div>
        </InputGroup>

        <InputGroup>
          <Label>E-mail</Label>
          <div className="relative">
            <IconMail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" className="pl-10" />
          </div>
        </InputGroup>

        <InputGroup>
          <Label>Senha</Label>
          <div className="relative">
            <IconLock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <Input
              type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" required autoComplete="new-password" className="pl-10 pr-10"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2">
              {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
            </button>
          </div>
        </InputGroup>

        <InputGroup>
          <Label>Confirmar senha</Label>
          <div className="relative">
            <IconLock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <Input
              type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha" required autoComplete="new-password" className="pl-10"
            />
          </div>
        </InputGroup>

        {error && <p className="text-[13px] text-red-dim bg-red/10 border border-red/30 rounded-[10px] px-3.5 py-2.5">{error}</p>}

        <Button type="submit" variant="neon" disabled={loading} className="w-full mt-1">
          {loading ? 'Criando conta...' : 'Criar conta gratuita'}
        </Button>
      </form>

      <p className="text-center text-[13.5px] text-text-3 mt-6">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-purple-bright font-semibold hover:underline">Entrar</Link>
      </p>
    </div>
  );
}

function traduzErroSupabase(message: string): string {
  if (message.includes('already registered') || message.includes('already exists')) return 'Este e-mail já está cadastrado. Tente entrar na sua conta.';
  if (message.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (message.includes('invalid') && message.includes('email')) return 'Informe um e-mail válido.';
  return 'Não foi possível criar sua conta. Tente novamente em instantes.';
}
