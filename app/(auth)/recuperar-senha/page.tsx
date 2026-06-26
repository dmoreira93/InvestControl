'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label, InputGroup } from '@/components/ui';
import { IconMail } from '@/components/ui/icons';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/atualizar-senha`,
    });

    setLoading(false);

    if (resetError) {
      setError('Não foi possível enviar o e-mail de recuperação. Verifique o endereço e tente novamente.');
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
        <h1 className="font-display text-[20px] font-bold mb-2">Verifique seu e-mail</h1>
        <p className="text-text-3 text-[13.5px] mb-6 leading-relaxed">
          Se houver uma conta cadastrada com <strong className="text-text-1">{email}</strong>, enviamos um link para você redefinir sua senha.
        </p>
        <Link href="/login">
          <Button variant="ghost" className="w-full">Voltar para o login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-soft rounded-[20px] p-[28px]">
      <h1 className="font-display text-[22px] font-bold mb-1">Recuperar senha</h1>
      <p className="text-text-3 text-[13.5px] mb-6">Informe seu e-mail para receber um link de redefinição</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputGroup>
          <Label>E-mail</Label>
          <div className="relative">
            <IconMail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-3" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" className="pl-10" />
          </div>
        </InputGroup>

        {error && <p className="text-[13px] text-red-dim bg-red/10 border border-red/30 rounded-[10px] px-3.5 py-2.5">{error}</p>}

        <Button type="submit" variant="neon" disabled={loading} className="w-full mt-1">
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </Button>
      </form>

      <p className="text-center text-[13.5px] text-text-3 mt-6">
        Lembrou a senha?{' '}
        <Link href="/login" className="text-purple-bright font-semibold hover:underline">Voltar para o login</Link>
      </p>
    </div>
  );
}
