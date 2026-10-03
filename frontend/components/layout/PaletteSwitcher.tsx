'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PALETTES = [
  {
    id: '1',
    name: 'كهرمان العسل',
    sub: 'Royal Honey Amber',
    color: '#B8621B',
    isDefault: true,
  },
  {
    id: '2',
    name: 'ياقوت السديم',
    sub: 'Royal Nebula Ruby',
    color: '#7C1E2D',
  },
  {
    id: '3',
    name: 'شعلة النجم',
    sub: 'Solar Flame & Navy',
    color: '#C85422',
  },
  {
    id: '4',
    name: 'السديم الليلي',
    sub: 'Midnight Slate & Gold',
    color: '#1E293B',
  },
];

export function PaletteSwitcher() {
  const pathname = usePathname();
  const [activePalette, setActivePalette] = useState('1');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sadeem_palette') || '1';
      setActivePalette(saved);
      document.documentElement.setAttribute('data-palette', saved);
    } catch {
      // ignore
    }
  }, []);

  const selectPalette = (id: string) => {
    setActivePalette(id);
    document.documentElement.setAttribute('data-palette', id);
    try {
      localStorage.setItem('sadeem_palette', id);
    } catch {
      // ignore
    }
  };

  const current = PALETTES.find((p) => p.id === activePalette) || PALETTES[0];

  if (pathname === '/checkout') return null;

  return (
    <div className="fixed bottom-20 left-2.5 sm:bottom-20 sm:left-4 z-50 font-almarai direction-rtl select-none">
      {/* Expanded Palette Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white/98 backdrop-blur-md border border-brand-border rounded-xl shadow-2xl p-3 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border">
            <span className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
              </svg>
              <span>ألوان هوية سَدِيم</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand-muted hover:text-brand-dark text-xs p-1 rounded leading-none"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {PALETTES.map((pal) => {
              const isSelected = pal.id === activePalette;
              return (
                <button
                  key={pal.id}
                  onClick={() => selectPalette(pal.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg text-right transition-colors ${
                    isSelected
                      ? 'bg-brand-primary-soft border border-brand-primary/40'
                      : 'bg-white hover:bg-brand-surface border border-transparent'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: pal.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-brand-dark flex items-center gap-1">
                      <span>{pal.name}</span>
                      {pal.isDefault && <span className="text-[10px] text-brand-primary">★</span>}
                    </div>
                    <div className="text-[10px] text-brand-muted truncate">{pal.sub}</div>
                  </div>
                  {isSelected && (
                    <span className="text-brand-primary font-black text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-full bg-white/95 backdrop-blur-md border border-brand-border shadow-lg flex items-center justify-center sm:gap-2 transition-transform active:scale-95 cursor-pointer"
        title="معاينة وتبديل ألوان سَدِيم"
      >
        <span
          className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
          style={{ backgroundColor: current.color }}
        />
        <span className="hidden sm:inline text-xs font-bold text-brand-dark">
          {current.name}
        </span>
        <svg
          className="hidden sm:inline text-brand-muted"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>
  );
}
