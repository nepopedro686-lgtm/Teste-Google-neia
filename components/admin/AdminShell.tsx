'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, testFirestoreConnection } from '@/lib/firebase';
import {
  checkIsUserAdmin,
  checkTestSession,
  deleteDress,
  duplicateDress,
  fetchAllDressesAdmin,
  fetchStoreSettingsAdmin,
  markDemoExamplesHandled,
  quickUpdateDressField,
  seedDemoDresses,
  signInWithAdminGoogle,
  signInWithAdminPassword,
  signInWithTestPassword,
  signOutTestSession,
} from '@/lib/admin-service';
import {
  ADMIN_AUTH_EMAIL,
  AVAILABILITY_LABELS,
  DEFAULT_STORE_SETTINGS,
  Dress,
  DressAvailability,
  DressStatus,
  STATUS_LABELS,
  StoreSettings,
} from '@/lib/types';
import { formatBRL, parsePriceInput } from '@/lib/validation';
import { BrandMark } from '@/components/BrandMark';
import { BoutiqueImage } from '@/components/BoutiqueImage';
import { DressDetailClient } from '@/components/DressDetailClient';
import { DressFormModal } from './DressFormModal';
import { SettingsForm } from './SettingsForm';
import { PasswordManager } from './PasswordManager';
import firebaseConfig from '@/firebase-applet-config.json';

type AdminTab = 'dresses' | 'settings' | 'security';

export function AdminShell() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [testAuth, setTestAuth] = useState(false);

  // Password login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [needsProviderSetup, setNeedsProviderSetup] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('dresses');
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Dress filters & editing
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DressStatus>('all');
  const [editingDress, setEditingDress] = useState<Dress | null | undefined>(
    undefined
  );
  const [previewDress, setPreviewDress] = useState<Dress | null>(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<Dress | null>(null);
  const [quickPriceTarget, setQuickPriceTarget] = useState<Dress | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const loadAdminData = useCallback(async (uid?: string) => {
    setDataLoading(true);
    setActionError('');
    try {
      let [dressList, storeCfg] = await Promise.all([
        fetchAllDressesAdmin(),
        fetchStoreSettingsAdmin(),
      ]);

      if (uid && dressList.length === 0 && !storeCfg.hideDemoExamples) {
        await seedDemoDresses(uid, storeCfg);
        [dressList, storeCfg] = await Promise.all([
          fetchAllDressesAdmin(),
          fetchStoreSettingsAdmin(),
        ]);
      }

      setDresses(dressList);
      setSettings(storeCfg);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os dados do painel.'
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void testFirestoreConnection();
    const testSessionPromise = checkTestSession();

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      const hasTestSession = await testSessionPromise;
      if (!mounted) return;

      setUser(nextUser);
      setTestAuth(hasTestSession);

      if (nextUser) {
        const allowed = checkIsUserAdmin(nextUser);
        setIsAdmin(allowed);
        if (allowed) {
          void loadAdminData(nextUser.uid);
        }
      } else if (hasTestSession) {
        setIsAdmin(false);
        void loadAdminData('test-admin');
      } else {
        setIsAdmin(false);
        setDresses([]);
      }
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [loadAdminData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setNeedsProviderSetup(false);

    if (!passwordInput) {
      setAuthError('Digite a senha administrativa.');
      return;
    }

    setAuthLoading(true);
    try {
      const okTest = await signInWithTestPassword(passwordInput);
      if (okTest) {
        setTestAuth(true);
        setPasswordInput('');
        await loadAdminData('test-admin');
        return;
      }

      await signInWithAdminPassword(passwordInput);
      setPasswordInput('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.includes('operation-not-allowed') ||
        msg.includes('PASSWORD_LOGIN_DISABLED')
      ) {
        setNeedsProviderSetup(true);
        setAuthError(
          'Senha incorreta para o acesso de teste. Caso deseje usar uma senha personalizada no Firebase, ative o provedor E-mail/senha abaixo.'
        );
      } else if (
        msg.includes('invalid-credential') ||
        msg.includes('wrong-password') ||
        msg.includes('user-not-found')
      ) {
        setAuthError(
          'Senha incorreta. Verifique a senha informada e tente novamente.'
        );
      } else {
        setAuthError('Não foi possível entrar. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setAuthError('');
    setNeedsProviderSetup(false);
    setAuthLoading(true);
    try {
      await signInWithAdminGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Não foi possível entrar com a conta Google.'
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await signOutTestSession();
    setTestAuth(false);
    setDresses([]);
    if (auth.currentUser) {
      await signOut(auth);
    }
  }

  const stats = useMemo(() => {
    const total = dresses.length;
    const published = dresses.filter((d) => d.status === 'published').length;
    const unavailable = dresses.filter(
      (d) => d.availability === 'sold_out' || d.status !== 'published'
    ).length;
    return { total, published, unavailable };
  }, [dresses]);

  const filteredDresses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dresses.filter((dress) => {
      if (q && !dress.name.toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && dress.status !== statusFilter) return false;
      return true;
    });
  }, [dresses, searchQuery, statusFilter]);

  async function handleAvailabilityChange(
    dress: Dress,
    nextAvailability: DressAvailability
  ) {
    setBusyId(dress.id);
    setActionError('');
    try {
      await quickUpdateDressField(dress.id, { availability: nextAvailability });
      setDresses((prev) =>
        prev.map((d) =>
          d.id === dress.id ? { ...d, availability: nextAvailability } : d
        )
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Erro ao atualizar disponibilidade.'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatusChange(dress: Dress, nextStatus: DressStatus) {
    if (nextStatus === 'published' && !dress.mainImageUrl) {
      setActionError(
        `Para publicar "${dress.name}", adicione primeiro uma imagem principal em Editar.`
      );
      return;
    }
    setBusyId(dress.id);
    setActionError('');
    try {
      await quickUpdateDressField(dress.id, { status: nextStatus });
      setDresses((prev) =>
        prev.map((d) => (d.id === dress.id ? { ...d, status: nextStatus } : d))
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Erro ao atualizar status.'
      );
    } finally {
      setBusyId(null);
    }
  }

  const activeUid = user?.uid ?? (testAuth ? 'test-admin' : '');

  async function handleDuplicate(dress: Dress) {
    if (!activeUid) return;
    setBusyId(dress.id);
    setActionError('');
    try {
      await duplicateDress(dress, activeUid);
      await loadAdminData(activeUid);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Erro ao duplicar vestido.'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteTarget || !activeUid) return;
    setBusyId(confirmDeleteTarget.id);
    setActionError('');
    try {
      await deleteDress(confirmDeleteTarget.id);
      await markDemoExamplesHandled(settings, activeUid);
      setDresses((prev) => prev.filter((d) => d.id !== confirmDeleteTarget.id));
      setSettings((prev) => ({ ...prev, hideDemoExamples: true }));
      setConfirmDeleteTarget(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Erro ao excluir vestido.'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveQuickPrice(e: React.FormEvent) {
    e.preventDefault();
    if (!quickPriceTarget) return;
    const nextPrice = parsePriceInput(quickPriceValue);
    setBusyId(quickPriceTarget.id);
    setActionError('');
    try {
      await quickUpdateDressField(quickPriceTarget.id, { currentPrice: nextPrice });
      setDresses((prev) =>
        prev.map((d) =>
          d.id === quickPriceTarget.id ? { ...d, currentPrice: nextPrice } : d
        )
      );
      setQuickPriceTarget(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Erro ao atualizar preço.'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleSeedDemo() {
    if (!activeUid) return;
    setSeedingDemo(true);
    setActionError('');
    try {
      await seedDemoDresses(activeUid, settings);
      await loadAdminData(activeUid);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Erro ao inserir exemplos ilustrativos.'
      );
    } finally {
      setSeedingDemo(false);
    }
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-[#393333]">
          <Loader2 className="w-5 h-5 animate-spin text-[#211D1D]" />
          <span>Verificando sessão administrativa...</span>
        </div>
      </div>
    );
  }

  // Password-Only Login Gate (No Google Account Needed)
  if (!user && !testAuth) {
    const firebaseAuthConsoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

    return (
      <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#D8CABC] rounded-lg p-7 sm:p-8 space-y-6">
          <div className="flex justify-center">
            <BrandMark />
          </div>
          <div className="text-center space-y-2">
            <h1 className="font-serif text-3xl font-medium text-[#211D1D]">
              Painel da Boutique
            </h1>
            <p className="text-sm text-[#393333] leading-relaxed">
              Digite a senha administrativa para gerenciar vestidos, fotos e informações da loja.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="text-xs text-[#211D1D] bg-[#F7F4EF] border border-[#211D1D] rounded-md p-3.5 space-y-2"
            >
              <p className="font-medium">{authError}</p>
              {needsProviderSetup && (
                <ol className="list-decimal list-inside space-y-1 text-[#393333]">
                  <li>
                    Acesse{' '}
                    <a
                      href={firebaseAuthConsoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-[#211D1D] font-medium"
                    >
                      Firebase Authentication → Sign-in method
                    </a>
                    .
                  </li>
                  <li>
                    Clique em <strong>Adicionar provedor</strong> → <strong>E-mail/senha</strong> e
                    ative-o.
                  </li>
                  <li>
                    Em <strong>Users</strong>, crie o usuário{' '}
                    <code className="bg-[#FFFFFF] px-1 py-0.5 rounded border border-[#D8CABC]">
                      {ADMIN_AUTH_EMAIL}
                    </code>{' '}
                    com a senha que desejar.
                  </li>
                </ol>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-medium text-[#211D1D]">
                Senha de acesso
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full h-12 pl-3.5 pr-11 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#8D8177] hover:text-[#211D1D]"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] disabled:opacity-60 transition-colors"
            >
              {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{authLoading ? 'Entrando...' : 'Entrar no painel'}</span>
            </button>
          </form>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[#D8CABC]/70" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#FFFFFF] px-3 text-[#8D8177]">ou acesso imediato</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 text-xs font-medium border border-[#D8CABC] text-[#211D1D] rounded-md hover:bg-[#F7F4EF] disabled:opacity-60 transition-colors"
          >
            Entrar com Google (já ativo neste projeto)
          </button>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block text-xs text-[#393333] underline underline-offset-4 decoration-[#D8CABC] hover:text-[#211D1D]"
            >
              Voltar ao site público
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin && !testAuth) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#FFFFFF] border border-[#D8CABC] rounded-lg p-8 text-center space-y-5">
          <div className="flex justify-center">
            <BrandMark />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-medium text-[#211D1D]">
              Acesso não autorizado
            </h1>
            <p className="text-sm text-[#393333] leading-relaxed">
              Esta sessão não possui permissão administrativa. Saia e entre utilizando a senha
              administrativa configurada.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[44px] px-5 py-2.5 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333]"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  const whatsappConfigured = settings.whatsappNumber.replace(/\D/g, '').length >= 10;

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#D8CABC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark storeName={settings.storeName} logoUrl={settings.logoUrl} />
            <span className="hidden sm:inline text-xs text-[#8D8177] border-l border-[#D8CABC] pl-3">
              Painel
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D8CABC] text-[#211D1D] rounded-md hover:bg-[#F7F4EF] whitespace-nowrap"
            >
              <span>Ver site</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#393333] hover:text-[#211D1D] rounded-md hover:bg-[#F7F4EF] whitespace-nowrap"
              aria-label="Sair do painel administrativo"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {testAuth && !user && (
          <div className="bg-[#FFFFFF] border border-[#D8CABC] rounded-lg px-4 py-3 text-xs text-[#393333] leading-relaxed">
            <strong className="text-[#211D1D] font-medium">Modo de teste por senha ativo:</strong>{' '}
            suas alterações ficam salvas neste servidor ativo para validação do catálogo e do painel.
            Para sincronização permanente na nuvem entre reinicializações, entre com a conta Google
            autorizada ou ative E-mail/senha no Firebase.
          </div>
        )}

        {/* Dashboard Summary */}
        <section className="grid grid-cols-3 gap-3 sm:gap-4" aria-label="Resumo do catálogo">
          <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-3.5 sm:p-5">
            <p className="text-[11px] sm:text-xs text-[#8D8177]">Cadastrados</p>
            <p className="font-serif text-2xl sm:text-3xl font-medium text-[#211D1D] tabular-nums mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-3.5 sm:p-5">
            <p className="text-[11px] sm:text-xs text-[#8D8177]">Publicados</p>
            <p className="font-serif text-2xl sm:text-3xl font-medium text-[#211D1D] tabular-nums mt-1">
              {stats.published}
            </p>
          </div>
          <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-3.5 sm:p-5">
            <p className="text-[11px] sm:text-xs text-[#8D8177]">Indisponíveis</p>
            <p className="font-serif text-2xl sm:text-3xl font-medium text-[#211D1D] tabular-nums mt-1">
              {stats.unavailable}
            </p>
          </div>
        </section>

        {/* WhatsApp Configuration Reminder */}
        {!whatsappConfigured && activeTab !== 'settings' && (
          <div className="bg-[#FFFFFF] border border-[#211D1D]/40 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-[#211D1D] mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-[#211D1D]">
                  WhatsApp da loja ainda não configurado
                </p>
                <p className="text-xs text-[#393333] mt-0.5">
                  Cadastre seu número em Configurações para ativar os botões de conversa em todos
                  os vestidos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2 text-xs font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] whitespace-nowrap self-start sm:self-auto"
            >
              Configurar WhatsApp
            </button>
          </div>
        )}

        {/* Section Tabs */}
        <div
          className="flex items-center gap-2 border-b border-[#D8CABC]"
          role="tablist"
          aria-label="Seções do painel"
        >
          {(
            [
              { id: 'dresses', label: 'Vestidos' },
              { id: 'settings', label: 'Configurações' },
              { id: 'security', label: 'Senha' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#211D1D] text-[#211D1D]'
                  : 'border-transparent text-[#8D8177] hover:text-[#211D1D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {actionError && (
          <div
            role="alert"
            className="bg-[#FFFFFF] border border-[#211D1D] text-[#211D1D] rounded-lg p-4 text-sm font-medium"
          >
            {actionError}
          </div>
        )}

        {/* Tab 1: Dresses CRUD */}
        {activeTab === 'dresses' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search
                  className="w-4 h-4 text-[#8D8177] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar vestido..."
                  aria-label="Pesquisar vestido no painel"
                  className="w-full h-11 pl-10 pr-4 bg-[#FFFFFF] border border-[#D8CABC] rounded-md text-sm text-[#211D1D] placeholder:text-[#8D8177] focus:outline-none focus:border-[#211D1D]"
                />
              </div>

              <button
                type="button"
                onClick={() => setEditingDress(null)}
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Novo vestido</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por status">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'published', label: 'Publicados' },
                  { id: 'draft', label: 'Rascunhos' },
                  { id: 'archived', label: 'Arquivados' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusFilter(item.id)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === item.id
                      ? 'bg-[#211D1D] text-[#F7F4EF]'
                      : 'bg-[#FFFFFF] border border-[#D8CABC] text-[#393333] hover:bg-[#F7F4EF]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {dataLoading ? (
              <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-12 flex items-center justify-center gap-3 text-sm text-[#393333]">
                <Loader2 className="w-5 h-5 animate-spin text-[#211D1D]" />
                <span>Carregando vestidos...</span>
              </div>
            ) : dresses.length === 0 ? (
              <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-8 sm:p-12 text-center space-y-4">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#211D1D]">
                  Nenhum vestido cadastrado ainda
                </h2>
                <p className="text-sm text-[#393333] max-w-md mx-auto">
                  Cadastre o primeiro vestido da boutique com foto do celular ou computador, ou
                  insira os modelos ilustrativos de exemplo.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingDress(null)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar primeiro vestido</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSeedDemo}
                    disabled={seedingDemo}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-medium border border-[#D8CABC] text-[#211D1D] rounded-md hover:bg-[#F7F4EF] disabled:opacity-60"
                  >
                    {seedingDemo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Inserir 3 exemplos ilustrativos</span>
                  </button>
                </div>
              </div>
            ) : filteredDresses.length === 0 ? (
              <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-10 text-center text-sm text-[#393333]">
                Nenhum vestido encontrado com este filtro.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDresses.map((dress) => {
                  const formattedPrice = formatBRL(dress.currentPrice);
                  const isBusy = busyId === dress.id;
                  return (
                    <article
                      key={dress.id}
                      className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex gap-4 flex-1 min-w-0">
                        <div className="relative w-20 sm:w-24 aspect-[3/4] rounded-md overflow-hidden border border-[#D8CABC]/60 bg-[#F7F4EF] shrink-0">
                          <BoutiqueImage
                            src={dress.mainImageUrl}
                            alt={dress.name}
                            fill
                            sizes="96px"
                            className="object-cover object-top"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-xs text-[#8D8177]">
                            {[
                              STATUS_LABELS[dress.status],
                              dress.category,
                              dress.isDemo ? 'Exemplo ilustrativo' : '',
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <h3 className="font-serif text-xl font-medium text-[#211D1D] leading-snug break-words">
                            {dress.name}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setQuickPriceTarget(dress);
                                setQuickPriceValue(
                                  dress.currentPrice !== null
                                    ? dress.currentPrice.toFixed(2).replace('.', ',')
                                    : ''
                                );
                              }}
                              className="text-sm font-medium text-[#211D1D] tabular-nums underline underline-offset-4 decoration-[#D8CABC] hover:decoration-[#211D1D]"
                              title="Clique para alterar o preço rapidamente"
                            >
                              {formattedPrice ?? 'Definir preço'}
                            </button>
                          </div>

                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <label className="sr-only" htmlFor={`avail-${dress.id}`}>
                              Disponibilidade de {dress.name}
                            </label>
                            <select
                              id={`avail-${dress.id}`}
                              value={dress.availability}
                              disabled={isBusy}
                              onChange={(e) =>
                                handleAvailabilityChange(
                                  dress,
                                  e.target.value as DressAvailability
                                )
                              }
                              className="h-9 px-2.5 text-xs font-medium bg-[#F7F4EF] border border-[#D8CABC] rounded-md text-[#211D1D]"
                            >
                              <option value="available">Disponível</option>
                              <option value="last_units">Últimas unidades</option>
                              <option value="sold_out">Esgotado</option>
                            </select>

                            {dress.status === 'published' ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(dress, 'draft')}
                                className="h-9 px-3 text-xs font-medium border border-[#D8CABC] text-[#393333] rounded-md hover:bg-[#F7F4EF]"
                              >
                                Retirar do site
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleStatusChange(dress, 'published')}
                                className="h-9 px-3 text-xs font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333]"
                              >
                                Publicar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-col justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#D8CABC]/50 shrink-0">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingDress(dress)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#F7F4EF] border border-[#D8CABC] text-[#211D1D] rounded-md hover:bg-[#D8CABC]/30"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewDress(dress)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D8CABC] text-[#393333] rounded-md hover:bg-[#F7F4EF]"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Prévia</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDuplicate(dress)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D8CABC] text-[#393333] rounded-md hover:bg-[#F7F4EF]"
                            title="Criar cópia em rascunho"
                          >
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Duplicar</span>
                          </button>

                          {dress.status !== 'archived' && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleStatusChange(dress, 'archived')}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D8CABC] text-[#393333] rounded-md hover:bg-[#F7F4EF]"
                              title="Arquivar produto"
                            >
                              <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Arquivar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setConfirmDeleteTarget(dress)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D8CABC] text-[#393333] rounded-md hover:border-[#211D1D] hover:text-[#211D1D]"
                            title="Excluir definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Store Settings */}
        {activeTab === 'settings' && (
          <SettingsForm
            initialSettings={settings}
            userUid={activeUid}
            onSaved={(next) => setSettings(next)}
          />
        )}

        {/* Tab 3: Password Management */}
        {activeTab === 'security' &&
          (user ? (
            <PasswordManager />
          ) : (
            <section className="max-w-xl bg-[#FFFFFF] border border-[#D8CABC]/80 rounded-lg p-6 sm:p-7 space-y-3">
              <h2 className="font-serif text-2xl font-medium text-[#211D1D]">
                Senha de teste configurada no servidor
              </h2>
              <p className="text-sm text-[#393333] leading-relaxed">
                Você está acessando com a senha de teste temporária configurada no servidor. Ela
                pode ser personalizada pela variável de ambiente{' '}
                <code className="bg-[#F7F4EF] px-1.5 py-0.5 rounded border border-[#D8CABC] text-xs text-[#211D1D]">
                  ADMIN_TEST_PASSWORD
                </code>{' '}
                nos Secrets do projeto.
              </p>
              <p className="text-xs text-[#8D8177] leading-relaxed">
                Para alterar a senha diretamente por aqui no navegador com persistência em nuvem,
                ative o provedor E-mail/senha no Firebase Authentication e faça login com o e-mail
                administrativo{' '}
                <code className="bg-[#F7F4EF] px-1 py-0.5 rounded border border-[#D8CABC] text-[#211D1D]">
                  {ADMIN_AUTH_EMAIL}
                </code>
                .
              </p>
            </section>
          ))}
      </main>

      {/* Create / Edit Dress Modal */}
      {editingDress !== undefined && (
        <DressFormModal
          dress={editingDress}
          userUid={activeUid}
          settings={settings}
          onClose={() => setEditingDress(undefined)}
          onSaved={async () => {
            await markDemoExamplesHandled(settings, activeUid);
            await loadAdminData(activeUid);
          }}
        />
      )}

      {/* Quick Price Modal */}
      {quickPriceTarget && (
        <div
          className="fixed inset-0 z-50 bg-[#211D1D]/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Alterar preço rapidamente"
        >
          <form
            onSubmit={handleSaveQuickPrice}
            className="w-full max-w-sm bg-[#FFFFFF] border border-[#D8CABC] rounded-lg p-6 space-y-4"
          >
            <h3 className="font-serif text-2xl font-medium text-[#211D1D]">
              Alterar preço
            </h3>
            <p className="text-xs text-[#393333]">{quickPriceTarget.name}</p>
            <div className="space-y-1.5">
              <label htmlFor="quick-price" className="block text-xs font-medium text-[#211D1D]">
                Valor em R$ (deixe vazio para Sob consulta)
              </label>
              <input
                id="quick-price"
                type="text"
                inputMode="decimal"
                autoFocus
                value={quickPriceValue}
                onChange={(e) => setQuickPriceValue(e.target.value)}
                placeholder="Ex.: 450,00"
                className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] tabular-nums focus:outline-none focus:border-[#211D1D]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickPriceTarget(null)}
                className="px-4 py-2.5 text-xs font-medium border border-[#D8CABC] text-[#211D1D] rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busyId === quickPriceTarget.id}
                className="px-5 py-2.5 text-xs font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md"
              >
                Salvar preço
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-[#211D1D]/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar exclusão"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] border border-[#D8CABC] rounded-lg p-6 space-y-4">
            <h3 className="font-serif text-2xl font-medium text-[#211D1D]">
              Excluir vestido?
            </h3>
            <p className="text-sm text-[#393333] leading-relaxed">
              Tem certeza que deseja excluir permanentemente{' '}
              <strong>{confirmDeleteTarget.name}</strong>? Se quiser apenas ocultá-lo do site sem
              perder o cadastro, você pode arquivá-lo.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTarget(null)}
                className="px-4 py-2.5 text-xs font-medium border border-[#D8CABC] text-[#211D1D] rounded-md hover:bg-[#F7F4EF]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={busyId === confirmDeleteTarget.id}
                className="px-5 py-2.5 text-xs font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333]"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDress && (
        <div
          className="fixed inset-0 z-50 bg-[#F7F4EF] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Prévia do vestido"
        >
          <div className="sticky top-0 z-10 bg-[#211D1D] text-[#F7F4EF] px-4 h-14 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium">
              Prévia da página individual ({STATUS_LABELS[previewDress.status]})
            </span>
            <button
              type="button"
              onClick={() => setPreviewDress(null)}
              className="px-3.5 py-1.5 text-xs font-medium bg-[#F7F4EF] text-[#211D1D] rounded-md"
            >
              Fechar prévia
            </button>
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <DressDetailClient dress={previewDress} settings={settings} />
          </div>
        </div>
      )}
    </div>
  );
}
