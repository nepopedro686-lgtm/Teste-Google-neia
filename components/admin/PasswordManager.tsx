'use client';

import React, { useState } from 'react';
import { Check, KeyRound, Loader2 } from 'lucide-react';
import { changeAdminPassword } from '@/lib/admin-service';

export function PasswordManager() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('A confirmação da nova senha não confere.');
      return;
    }

    setSaving(true);
    try {
      await changeAdminPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('Senha administrativa atualizada com sucesso.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        setErrorMsg('A senha atual informada está incorreta.');
      } else {
        setErrorMsg(
          'Não foi possível alterar a senha. Se necessário, saia e entre novamente antes de tentar.'
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <section className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-[#211D1D] mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#211D1D]">
              Alterar Senha do Painel
            </h2>
            <p className="text-sm text-[#393333] mt-1">
              O acesso ao painel utiliza apenas esta senha, sem necessidade de conta Google.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="text-sm font-medium text-[#211D1D] bg-[#F7F4EF] border border-[#211D1D] rounded-md p-3.5"
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 text-sm font-medium text-[#211D1D] bg-[#F7F4EF] border border-[#D8CABC] rounded-md p-3.5">
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="cur-pass" className="block text-xs font-medium text-[#211D1D]">
              Senha atual
            </label>
            <input
              id="cur-pass"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-pass" className="block text-xs font-medium text-[#211D1D]">
              Nova senha (mínimo 6 caracteres)
            </label>
            <input
              id="new-pass"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="conf-pass" className="block text-xs font-medium text-[#211D1D]">
              Confirmar nova senha
            </label>
            <input
              id="conf-pass"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{saving ? 'Atualizando...' : 'Salvar nova senha'}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
