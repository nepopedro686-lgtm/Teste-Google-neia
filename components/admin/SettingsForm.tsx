'use client';

import React, { useState } from 'react';
import { Check, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { StoreSettings } from '@/lib/types';
import { saveStoreSettings, uploadImageToMedia } from '@/lib/admin-service';
import { processImageUpload } from '@/lib/image-optimizer';
import {
  buildCatalogWhatsAppMessage,
  buildWhatsAppUrl,
  formatWhatsAppDisplay,
} from '@/lib/validation';
import { BoutiqueImage } from '@/components/BoutiqueImage';

interface SettingsFormProps {
  initialSettings: StoreSettings;
  userUid: string;
  onSaved: (nextSettings: StoreSettings) => void;
}

export function SettingsForm({
  initialSettings,
  userUid,
  onSaved,
}: SettingsFormProps) {
  const [form, setForm] = useState<Omit<StoreSettings, 'updatedAt' | 'updatedBy'>>({
    storeName: initialSettings.storeName,
    logoUrl: initialSettings.logoUrl,
    heroTitle: initialSettings.heroTitle,
    heroSubtitle: initialSettings.heroSubtitle,
    heroImageUrl: initialSettings.heroImageUrl,
    aboutTitle: initialSettings.aboutTitle,
    aboutText: initialSettings.aboutText,
    aboutImageUrl: initialSettings.aboutImageUrl,
    whatsappNumber: initialSettings.whatsappNumber,
    phone: initialSettings.phone,
    address: initialSettings.address,
    openingHours: initialSettings.openingHours,
    instagramUrl: initialSettings.instagramUrl,
    otherSocialUrl: initialSettings.otherSocialUrl,
    hideDemoExamples: Boolean(initialSettings.hideDemoExamples),
  });

  const [uploadingField, setUploadingField] = useState<
    'logoUrl' | 'heroImageUrl' | 'aboutImageUrl' | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleImageUpload(
    field: 'logoUrl' | 'heroImageUrl' | 'aboutImageUrl',
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg('');
    setUploadingField(field);
    try {
      const processed = await processImageUpload(file);
      const url = await uploadImageToMedia(processed, userUid);
      setForm((prev) => ({ ...prev, [field]: url }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar imagem.');
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSavedNotice(false);
    setSaving(true);
    try {
      await saveStoreSettings(form, userUid);
      onSaved({ ...form });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3500);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Não foi possível salvar as configurações.'
      );
    } finally {
      setSaving(false);
    }
  }

  const previewWhatsappUrl = buildWhatsAppUrl(
    form.whatsappNumber,
    buildCatalogWhatsAppMessage(form.storeName)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div
          role="alert"
          className="bg-[#FFFFFF] border border-[#211D1D] text-[#211D1D] rounded-lg p-4 text-sm font-medium"
        >
          {errorMsg}
        </div>
      )}

      {/* WhatsApp & Contact Section */}
      <section className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#211D1D]">
            WhatsApp e Contato
          </h2>
          <p className="text-xs text-[#393333]/80 mt-0.5">
            Deixe em branco qualquer informação que não desejar exibir no site.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="cfg-wa" className="block text-xs font-medium text-[#211D1D]">
              Número do WhatsApp (com DDD)
            </label>
            <input
              id="cfg-wa"
              type="tel"
              maxLength={20}
              value={form.whatsappNumber}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))
              }
              placeholder="Ex.: 24999999999"
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] tabular-nums focus:outline-none focus:border-[#211D1D]"
            />
            {previewWhatsappUrl ? (
              <p className="text-xs text-[#393333]">
                Ativo: {formatWhatsAppDisplay(form.whatsappNumber)} ·{' '}
                <a
                  href={previewWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#211D1D]"
                >
                  Testar link
                </a>
              </p>
            ) : (
              <p className="text-xs text-[#8D8177]">
                Informe DDD + número (10 ou 11 dígitos) para ativar os botões de WhatsApp.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cfg-phone" className="block text-xs font-medium text-[#211D1D]">
              Telefone adicional (opcional)
            </label>
            <input
              id="cfg-phone"
              type="tel"
              maxLength={30}
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Ex.: (24) 3348-0000"
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] tabular-nums focus:outline-none focus:border-[#211D1D]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cfg-address" className="block text-xs font-medium text-[#211D1D]">
            Endereço completo
          </label>
          <input
            id="cfg-address"
            type="text"
            maxLength={200}
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cfg-hours" className="block text-xs font-medium text-[#211D1D]">
            Horário de funcionamento (opcional)
          </label>
          <textarea
            id="cfg-hours"
            rows={2}
            maxLength={200}
            value={form.openingHours}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, openingHours: e.target.value }))
            }
            placeholder="Ex.: Segunda a sexta, das 9h às 18h · Sábado, das 9h às 13h"
            className="w-full p-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="cfg-insta" className="block text-xs font-medium text-[#211D1D]">
              Link do Instagram
            </label>
            <input
              id="cfg-insta"
              type="url"
              maxLength={200}
              value={form.instagramUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, instagramUrl: e.target.value }))
              }
              placeholder="https://www.instagram.com/neia_concept/"
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cfg-social" className="block text-xs font-medium text-[#211D1D]">
              Outro link social (opcional)
            </label>
            <input
              id="cfg-social"
              type="url"
              maxLength={200}
              value={form.otherSocialUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, otherSocialUrl: e.target.value }))
              }
              placeholder="https://..."
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
          </div>
        </div>
      </section>

      {/* Store Identity & Homepage Texts */}
      <section className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-5 sm:p-6 space-y-5">
        <h2 className="font-serif text-2xl font-medium text-[#211D1D]">
          Identidade e Página Inicial
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div className="space-y-1.5">
            <label htmlFor="cfg-name" className="block text-xs font-medium text-[#211D1D]">
              Nome da loja
            </label>
            <input
              id="cfg-name"
              type="text"
              required
              maxLength={80}
              value={form.storeName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, storeName: e.target.value }))
              }
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-[#211D1D]">
              Logotipo personalizado (opcional)
            </span>
            <div className="flex items-center gap-3">
              {form.logoUrl && (
                <div className="w-24 h-11 relative bg-[#F7F4EF] border border-[#D8CABC] rounded p-1">
                  <BoutiqueImage
                    src={form.logoUrl}
                    alt="Logotipo"
                    fill
                    sizes="96px"
                    className="object-contain"
                  />
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border border-[#211D1D]/35 text-[#211D1D] rounded-md hover:bg-[#F7F4EF]">
                {uploadingField === 'logoUrl' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
                <span>{form.logoUrl ? 'Trocar logo' : 'Enviar logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload('logoUrl', e)}
                  className="sr-only"
                />
              </label>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, logoUrl: '' }))}
                  className="p-2 text-[#8D8177] hover:text-[#211D1D]"
                  aria-label="Usar logotipo padrão da boutique"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cfg-hero-title" className="block text-xs font-medium text-[#211D1D]">
            Título principal da página inicial
          </label>
          <input
            id="cfg-hero-title"
            type="text"
            required
            maxLength={140}
            value={form.heroTitle}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, heroTitle: e.target.value }))
            }
            className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cfg-hero-sub" className="block text-xs font-medium text-[#211D1D]">
            Texto de apresentação da página inicial
          </label>
          <textarea
            id="cfg-hero-sub"
            rows={3}
            maxLength={400}
            value={form.heroSubtitle}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, heroSubtitle: e.target.value }))
            }
            className="w-full p-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
          />
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-[#211D1D]">
            Imagem principal da capa
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative w-48 aspect-[4/3] rounded-md overflow-hidden border border-[#D8CABC] bg-[#F7F4EF]">
              <BoutiqueImage
                src={form.heroImageUrl || '/images/neia-hero-boutique.jpg'}
                alt="Imagem principal"
                fill
                sizes="192px"
                className="object-cover"
              />
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border border-[#211D1D]/35 text-[#211D1D] rounded-md hover:bg-[#F7F4EF] self-start">
              {uploadingField === 'heroImageUrl' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
              <span>Substituir foto da capa</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('heroImageUrl', e)}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      </section>

      {/* About / Institutional Section */}
      <section className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-5 sm:p-6 space-y-5">
        <h2 className="font-serif text-2xl font-medium text-[#211D1D]">
          Texto Institucional (Sobre)
        </h2>

        <div className="space-y-1.5">
          <label htmlFor="cfg-about-title" className="block text-xs font-medium text-[#211D1D]">
            Título institucional
          </label>
          <input
            id="cfg-about-title"
            type="text"
            required
            maxLength={120}
            value={form.aboutTitle}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, aboutTitle: e.target.value }))
            }
            className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cfg-about-text" className="block text-xs font-medium text-[#211D1D]">
            História da boutique (28 anos)
          </label>
          <textarea
            id="cfg-about-text"
            rows={6}
            maxLength={4000}
            value={form.aboutText}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, aboutText: e.target.value }))
            }
            className="w-full p-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
          />
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-medium text-[#211D1D]">
            Fotografia da página Sobre
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative w-48 aspect-[4/3] rounded-md overflow-hidden border border-[#D8CABC] bg-[#F7F4EF]">
              <BoutiqueImage
                src={form.aboutImageUrl || '/images/neia-atelier-interior.jpg'}
                alt="Boutique Neia Concept"
                fill
                sizes="192px"
                className="object-cover"
              />
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border border-[#211D1D]/35 text-[#211D1D] rounded-md hover:bg-[#F7F4EF] self-start">
              {uploadingField === 'aboutImageUrl' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
              <span>Substituir foto institucional</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('aboutImageUrl', e)}
                className="sr-only"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Save Action */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
        {savedNotice && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#211D1D]">
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>Configurações salvas e publicadas no site.</span>
          </span>
        )}
        <button
          type="submit"
          disabled={saving || uploadingField !== null}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{saving ? 'Salvando...' : 'Salvar configurações'}</span>
        </button>
      </div>
    </form>
  );
}
