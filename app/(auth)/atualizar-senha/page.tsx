'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label, InputGroup } from '@/components/ui';
import { IconLock, IconEye, IconEyeOff } from '@/components/ui/icons';

export default function AtualizarSenhaPage() {
  const router = useRouter();
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
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('Não foi possível atualizar sua senha. O link pode ter expirado — solicite um novo.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1800);
  }

  if (success) {
    return (
      <div className="bg-surface border border-border-soft rounded-[20px] p-[28px] text-center">
        <div className="w-14 h-14 rounded-full bg-neon/15 flex items-center justify-center mx-auto mb-4">
          <IconLock className="w-6 h-6 text-neon" />
        </div>
        <h1 className="font-display text-[20px] font-bold mb-2">Senha atualizada!</h1>
        <p className="text-text-3 text-[13.5px]">Redirecionando para o seu dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-soft rounded-[20px] p-[28px]">
      <h1 className="font-display text-[22px] font-bold mb-1">Definir nova senha</h1>
      <p className="text-text-3 text-[13.5px] mb-6">Escolha uma nova senha para sua conta</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputGroup>
          <Label>Nova senha</Label>
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
          <Label>Confirmar nova senha</Label>
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
          {loading ? 'Atualizando...' : 'Atualizar senha'}
        </Button>
      </form>
    </div>
  );
}
