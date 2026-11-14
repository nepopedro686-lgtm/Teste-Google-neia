'use client';

import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Dress, StoreSettings } from '@/lib/types';
import { DressCard } from './DressCard';
import { EmptyCatalogState } from './EmptyCatalogState';

interface CatalogClientProps {
  dresses: Dress[];
  settings: StoreSettings;
}

export function CatalogClient({ dresses, settings }: CatalogClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const dress of dresses) {
      const cat = dress.category.trim();
      if (cat) unique.add(cat);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [dresses]);

  const hasSoldOutItems = useMemo(
    () => dresses.some((d) => d.availability === 'sold_out'),
    [dresses]
  );

  const filteredDresses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return dresses.filter((dress) => {
      if (q && !dress.name.toLowerCase().includes(q)) {
        return false;
      }
      if (selectedCategory !== 'all' && dress.category.trim() !== selectedCategory) {
        return false;
      }
      if (onlyAvailable && dress.availability === 'sold_out') {
        return false;
      }
      return true;
    });
  }, [dresses, searchQuery, selectedCategory, onlyAvailable]);

  if (dresses.length === 0) {
    return <EmptyCatalogState settings={settings} />;
  }

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedCategory !== 'all' || onlyAvailable;

  return (
    <div className="space-y-8">
      {/* Search and Contextual Filters */}
      <div className="bg-[#FFFFFF] border border-[#D8CABC]/60 rounded-lg p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-[#8D8177] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar vestido pelo nome..."
              aria-label="Buscar vestido pelo nome"
              className="w-full h-11 pl-10 pr-9 bg-[#F7F4EF]/60 border border-[#D8CABC] rounded-md text-sm text-[#211D1D] placeholder:text-[#8D8177] focus:outline-none focus:border-[#211D1D] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8D8177] hover:text-[#211D1D]"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Count + Optional Availability Filter */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#393333]">
            {hasSoldOutItems && (
              <label className="inline-flex items-center gap-2 cursor-pointer select-none min-h-[36px]">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 accent-[#211D1D] rounded"
                />
                <span>Ocultar esgotados</span>
              </label>
            )}
            <span className="tabular-nums text-[#393333]/80">
              {filteredDresses.length}{' '}
              {filteredDresses.length === 1 ? 'vestido exibido' : 'vestidos exibidos'}
            </span>
          </div>
        </div>

        {/* Category Filter Tabs (only rendered when categories actually exist in catalog) */}
        {categories.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D8CABC]/40"
            role="group"
            aria-label="Filtrar por categoria"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[#211D1D] text-[#F7F4EF]'
                  : 'bg-[#F7F4EF] text-[#393333] hover:bg-[#D8CABC]/40'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#211D1D] text-[#F7F4EF]'
                    : 'bg-[#F7F4EF] text-[#393333] hover:bg-[#D8CABC]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Grid or No-Results State */}
      {filteredDresses.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#D8CABC]/70 rounded-lg px-6 py-14 text-center max-w-xl mx-auto">
          <h3 className="font-serif text-2xl font-medium text-[#211D1D]">
            Nenhum vestido encontrado
          </h3>
          <p className="mt-2 text-sm text-[#393333]">
            Não encontramos peças correspondentes aos critérios informados.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setOnlyAvailable(false);
              }}
              className="mt-5 inline-flex items-center px-5 py-2.5 text-xs font-medium bg-[#211D1D] text-[#F7F4EF] rounded-md hover:bg-[#393333] transition-colors"
            >
              Limpar filtros e ver todos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredDresses.map((dress) => (
            <DressCard key={dress.id} dress={dress} />
          ))}
        </div>
      )}
    </div>
  );
}
