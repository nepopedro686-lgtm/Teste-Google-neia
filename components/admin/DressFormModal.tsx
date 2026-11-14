'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  AVAILABILITY_LABELS,
  Dress,
  DressAvailability,
  DressStatus,
  STATUS_LABELS,
  StoreSettings,
} from '@/lib/types';
import {
  createDress,
  DressInput,
  updateDress,
  uploadImageToMedia,
} from '@/lib/admin-service';
import { processImageUpload } from '@/lib/image-optimizer';
import { formatBRL, parsePriceInput } from '@/lib/validation';
import { BoutiqueImage } from '@/components/BoutiqueImage';
import { DressDetailClient } from '@/components/DressDetailClient';

interface DressFormModalProps {
  dress: Dress | null; // null = create mode
  userUid: string;
  settings: StoreSettings;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const SUGGESTED_CATEGORIES = ['Festa', 'Midi', 'Longo', 'Curto', 'Casual'];

function priceToInputString(price: number | null | undefined): string {
  if (price === null || price === undefined) return '';
  return price.toFixed(2).replace('.', ',');
}

export function DressFormModal({
  dress,
  userUid,
  settings,
  onClose,
  onSaved,
}: DressFormModalProps) {
  const [name, setName] = useState(dress?.name ?? '');
  const [category, setCategory] = useState(dress?.category ?? '');
  const [description, setDescription] = useState(dress?.description ?? '');
  const [details, setDetails] = useState(dress?.details ?? '');
  const [currentPriceText, setCurrentPriceText] = useState(
    priceToInputString(dress?.currentPrice)
  );
  const [previousPriceText, setPreviousPriceText] = useState(
    priceToInputString(dress?.previousPrice)
  );
  const [mainImageUrl, setMainImageUrl] = useState(dress?.mainImageUrl ?? '');
  const [galleryImages, setGalleryImages] = useState<string[]>(
    dress?.galleryImages ?? []
  );
  const [availability, setAvailability] = useState<DressAvailability>(
    dress?.availability ?? 'available'
  );
  const [status, setStatus] = useState<DressStatus>(dress?.status ?? 'published');
  const [isDemo, setIsDemo] = useState<boolean>(Boolean(dress?.isDemo));

  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  async function handleMainImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg('');
    setUploadingMain(true);
    try {
      const processed = await processImageUpload(file);
      const uploadedUrl = await uploadImageToMedia(processed, userUid);
      setMainImageUrl(uploadedUrl);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao enviar imagem principal.'
      );
    } finally {
      setUploadingMain(false);
    }
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = 8 - galleryImages.length;
    if (remainingSlots <= 0) {
      setErrorMsg('A galeria adicional aceita no máximo 8 imagens.');
      return;
    }

    setErrorMsg('');
    setUploadingGallery(true);
    try {
      const slice = files.slice(0, remainingSlots);
      const nextUrls: string[] = [];
      for (const file of slice) {
        const processed = await processImageUpload(file);
        const uploadedUrl = await uploadImageToMedia(processed, userUid);
        nextUrls.push(uploadedUrl);
      }
      setGalleryImages((prev) => [...prev, ...nextUrls]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao enviar imagens da galeria.'
      );
    } finally {
      setUploadingGallery(false);
    }
  }

  function buildPayload(): DressInput {
    const currentPrice = parsePriceInput(currentPriceText);
    const previousPrice = parsePriceInput(previousPriceText);

    return {
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      details: details.trim(),
      currentPrice,
      previousPrice,
      mainImageUrl,
      galleryImages,
      availability,
      status,
      isDemo,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    const payload = buildPayload();
    if (!payload.name || payload.name.length < 2) {
      setErrorMsg('Informe o nome do vestido.');
      return;
    }
    if (payload.status === 'published' && !payload.mainImageUrl) {
      setErrorMsg(
        'Para publicar no catálogo, adicione uma imagem principal ou salve como Rascunho.'
      );
      return;
    }
    if (
      payload.previousPrice !== null &&
      payload.currentPrice !== null &&
      payload.previousPrice <= payload.currentPrice
    ) {
      setErrorMsg(
        'O preço anterior só deve ser informado quando for maior que o preço atual.'
      );
      return;
    }

    setSaving(true);
    try {
      if (dress) {
        await updateDress(dress.id, dress.slug, payload);
      } else {
        await createDress(payload, userUid);
      }
      await onSaved();
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Não foi possível salvar o vestido.'
      );
    } finally {
      setSaving(false);
    }
  }

  const previewDress: Dress = {
    id: dress?.id ?? 'preview',
    slug: dress?.slug ?? 'previa',
    ...buildPayload(),
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F4EF] overflow-y-auto">
      {/* Sticky Mobile-First Top Bar */}
      <div className="sticky top-0 z-20 bg-[#F7F4EF]/95 backdrop-blur-sm border-b border-[#D8CABC]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#211D1D] rounded-md hover:bg-[#D8CABC]/30"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Voltar</span>
          </button>

          <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#211D1D] truncate">
            {dress ? 'Editar Vestido' : 'Novo Vestido'}
          </h2>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[#211D1D]/30 text-[#211D1D] rounded-md hover:bg-[#FFFFFF]"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Prévia</span>
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-28"
      >
        {errorMsg && (
          <div
            role="alert"
            className="bg-[#FFFFFF] border border-[#211D1D] text-[#211D1D] rounded-lg p-4 text-sm font-medium"
          >
            {errorMsg}
          </div>
        )}

        {/* 1. Primary Image */}
        <section className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-xl font-medium text-[#211D1D]">
                Imagem principal
              </h3>
              <p className="text-xs text-[#393333]/80">
                Obrigatória para publicar no catálogo. Otimizada automaticamente para WebP.
              </p>
            </div>
          </div>

          {mainImageUrl ? (
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="relative w-44 aspect-[3/4] rounded-md overflow-hidden border border-[#D8CABC] bg-[#F7F4EF] shrink-0">
                <BoutiqueImage
                  src={mainImageUrl}
                  alt={name || 'Prévia do vestido'}
                  fill
                  sizes="176px"
                  className="object-cover object-top"
                />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333]">
                  {uploadingMain ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>{uploadingMain ? 'Enviando...' : 'Substituir foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                    disabled={uploadingMain}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setMainImageUrl('')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border border-[#D8CABC] text-[#393333] rounded-md hover:bg-[#F7F4EF]"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span>Remover</span>
                </button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-[#D8CABC] rounded-lg p-8 text-center bg-[#F7F4EF]/50 hover:bg-[#F7F4EF] transition-colors">
              {uploadingMain ? (
                <>
                  <Loader2 className="w-7 h-7 text-[#211D1D] animate-spin mb-2" />
                  <span className="text-sm font-medium text-[#211D1D]">
                    Otimizando e salvando imagem...
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-7 h-7 text-[#211D1D] mb-2" />
                  <span className="text-sm font-medium text-[#211D1D]">
                    Toque para escolher foto do celular ou computador
                  </span>
                  <span className="text-xs text-[#393333]/75 mt-1">
                    JPG, PNG ou WebP · Sem cortar o vestido
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageChange}
                disabled={uploadingMain}
                className="sr-only"
              />
            </label>
          )}
        </section>

        {/* 2. Essential Product Info */}
        <section className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-5 space-y-5">
          <h3 className="font-serif text-xl font-medium text-[#211D1D]">
            Informações do vestido
          </h3>

          <div className="space-y-1.5">
            <label htmlFor="dress-name" className="block text-xs font-medium text-[#211D1D]">
              Nome do vestido *
            </label>
            <input
              id="dress-name"
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Vestido Midi Seda Champagne"
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="dress-category" className="block text-xs font-medium text-[#211D1D]">
              Categoria (opcional)
            </label>
            <input
              id="dress-category"
              type="text"
              maxLength={60}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex.: Festa, Midi, Longo, Casual (opcional)"
              className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    category === cat
                      ? 'bg-[#211D1D] text-[#F7F4EF] border-[#211D1D]'
                      : 'bg-[#F7F4EF] text-[#393333] border-[#D8CABC]'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {category && (
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className="px-2.5 py-1.5 text-xs text-[#8D8177] hover:text-[#211D1D]"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="dress-price" className="block text-xs font-medium text-[#211D1D]">
                Preço atual em R$ (opcional)
              </label>
              <input
                id="dress-price"
                type="text"
                inputMode="decimal"
                value={currentPriceText}
                onChange={(e) => setCurrentPriceText(e.target.value)}
                placeholder="Ex.: 489,90"
                className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] tabular-nums focus:outline-none focus:border-[#211D1D]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dress-prev-price" className="block text-xs font-medium text-[#211D1D]">
                Preço anterior em R$ (somente promoção real)
              </label>
              <input
                id="dress-prev-price"
                type="text"
                inputMode="decimal"
                value={previousPriceText}
                onChange={(e) => setPreviousPriceText(e.target.value)}
                placeholder="Deixe vazio se não estiver em promoção"
                className="w-full h-11 px-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] tabular-nums focus:outline-none focus:border-[#211D1D]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dress-desc" className="block text-xs font-medium text-[#211D1D]">
              Descrição (opcional)
            </label>
            <textarea
              id="dress-desc"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Apresentação breve do vestido, caimento e ocasião..."
              className="w-full p-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dress-details" className="block text-xs font-medium text-[#211D1D]">
              Características e detalhes (opcional)
            </label>
            <textarea
              id="dress-details"
              rows={3}
              maxLength={1500}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Texto livre sobre tecido, acabamento, forro ou observações..."
              className="w-full p-3.5 bg-[#F7F4EF]/50 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] focus:outline-none focus:border-[#211D1D]"
            />
          </div>
        </section>

        {/* 3. Availability & Publication Status */}
        <section className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-5 space-y-5">
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-[#211D1D]">Disponibilidade</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['available', 'last_units', 'sold_out'] as DressAvailability[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAvailability(opt)}
                  className={`min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-md border transition-colors ${
                    availability === opt
                      ? 'bg-[#211D1D] text-[#F7F4EF] border-[#211D1D]'
                      : 'bg-[#F7F4EF]/60 text-[#393333] border-[#D8CABC] hover:bg-[#F7F4EF]'
                  }`}
                >
                  {AVAILABILITY_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-[#D8CABC]/40">
            <p className="text-xs font-medium text-[#211D1D]">Status no site</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['published', 'draft', 'archived'] as DressStatus[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)}
                  className={`min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-md border transition-colors ${
                    status === opt
                      ? 'bg-[#211D1D] text-[#F7F4EF] border-[#211D1D]'
                      : 'bg-[#F7F4EF]/60 text-[#393333] border-[#D8CABC] hover:bg-[#F7F4EF]'
                  }`}
                >
                  {STATUS_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>

          {dress?.isDemo && (
            <label className="flex items-center gap-2.5 pt-2 text-xs text-[#393333]">
              <input
                type="checkbox"
                checked={!isDemo}
                onChange={(e) => setIsDemo(!e.target.checked)}
                className="w-4 h-4 accent-[#211D1D]"
              />
              <span>Remover marcação de exemplo ilustrativo (agora é peça real da loja)</span>
            </label>
          )}
        </section>

        {/* 4. Additional Gallery */}
        <section className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-xl font-medium text-[#211D1D]">
                Galeria adicional (opcional)
              </h3>
              <p className="text-xs text-[#393333]/80">
                Adicione até 8 fotos extras de ângulos ou detalhes ({galleryImages.length}/8).
              </p>
            </div>

            {galleryImages.length < 8 && (
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border border-[#211D1D]/40 text-[#211D1D] rounded-md hover:bg-[#F7F4EF] shrink-0">
                {uploadingGallery ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{uploadingGallery ? 'Enviando...' : 'Adicionar fotos'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryChange}
                  disabled={uploadingGallery}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {galleryImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {galleryImages.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative aspect-[3/4] rounded-md overflow-hidden border border-[#D8CABC] bg-[#F7F4EF]"
                >
                  <BoutiqueImage
                    src={url}
                    alt={`Galeria ${idx + 1}`}
                    fill
                    sizes="150px"
                    className="object-cover object-top"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-[#211D1D]/85 text-[#F7F4EF] flex items-center justify-center hover:bg-[#211D1D]"
                    aria-label={`Remover foto ${idx + 1} da galeria`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom Sticky Save Bar */}
        <div className="fixed bottom-0 inset-x-0 z-20 bg-[#FFFFFF]/95 backdrop-blur-sm border-t border-[#D8CABC] p-3 sm:p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="hidden sm:block text-xs text-[#393333] tabular-nums">
              {parsePriceInput(currentPriceText)
                ? `Valor: ${formatBRL(parsePriceInput(currentPriceText))}`
                : 'Preço sob consulta'}
              {' · '}
              {STATUS_LABELS[status]}
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-3 text-sm font-medium border border-[#D8CABC] text-[#211D1D] rounded-md hover:bg-[#F7F4EF]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || uploadingMain || uploadingGallery}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{saving ? 'Salvando...' : 'Salvar vestido'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Live Preview Modal Before Publishing */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#F7F4EF] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Prévia da página do vestido"
        >
          <div className="sticky top-0 z-10 bg-[#211D1D] text-[#F7F4EF] px-4 h-14 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium">
              Prévia visual de como o vestido aparecerá para clientes
            </span>
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
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
