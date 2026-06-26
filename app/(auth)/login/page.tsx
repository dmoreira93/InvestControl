'use client';

import { Suspense, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label, InputGroup } from '@/components/ui';
import { IconMail, IconLock, IconEye, IconEyeOff } from '@/components/ui/icons';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="bg-surface border border-border-soft rounded-[20px] p-[28px] animate-pulse">
      <div className="h-6 w-48 bg-surface-2 rounded mb-2" />
      <div className="h-4 w-64 bg-surface-2 rounded mb-6" />
      <div className="h-11 bg-surface-2 rounded-[10px] mb-4" />
      <div className="h-11 bg-surface-2 rounded-[10px] mb-4" />
      <div className="h-11 bg-surface-2 rounded-[10px]" />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(traduzErroSupabase(signInError.message));
      return;
    }

    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="bg-surface border border-border-soft rounded-[20px] p-[28px]">
      <h1 className="font-display text-[22px] font-bold mb-1">Entrar na sua conta</h1>
      <p className="text-text-3 text-[13.5px] mb-6">Acesse seu painel de investimentos e finanças</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputGroup>
          <Label>E-mail</Label>
          <div className="relative">
            <IconMail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <Input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" required autoComplete="email" className="pl-10"
            />
          </div>
        </InputGroup>

        <InputGroup>
          <div className="flex items-center justify-between">
            <Label>Senha</Label>
            <Link href="/recuperar-senha" className="text-[12px] text-purple-bright hover:underline">Esqueceu a senha?</Link>
          </div>
          <div className="relative">
            <IconLock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <Input
              type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password" className="pl-10 pr-10"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2">
              {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
            </button>
          </div>
        </InputGroup>

        {error && <p className="text-[13px] text-red-dim bg-red/10 border border-red/30 rounded-[10px] px-3.5 py-2.5">{error}</p>}

        <Button type="submit" variant="neon" disabled={loading} className="w-full mt-1">
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-center text-[13.5px] text-text-3 mt-6">
        Ainda não tem uma conta?{' '}
        <Link href="/cadastro" className="text-purple-bright font-semibold hover:underline">Criar conta gratuita</Link>
      </p>
    </div>
  );
}

function traduzErroSupabase(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  return 'Não foi possível entrar. Tente novamente em instantes.';
}
