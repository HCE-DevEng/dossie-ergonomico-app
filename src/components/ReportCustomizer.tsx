import React from 'react';
import { ReportConfig } from '../types';
import { Palette, Eye, Layout, Settings } from 'lucide-react';

interface ReportCustomizerProps {
  config: ReportConfig;
  onChange: (newConfig: ReportConfig) => void;
}

const presetColors = [
  { name: 'Azul Corporativo', value: '#1E3A8A' },
  { name: 'Verde Ergonômico', value: '#065F46' },
  { name: 'Roxo Moderno', value: '#5B21B6' },
  { name: 'Vermelho Terracota', value: '#991B1B' },
  { name: 'Grafite Clássico', value: '#374151' },
];

export default function ReportCustomizer({ config, onChange }: ReportCustomizerProps) {
  const updateField = (field: keyof ReportConfig, value: any) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="report-customizer-card">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-slate-500" />
        <h3 className="font-bold text-slate-800 tracking-tight">Personalizar Exportação</h3>
      </div>
      
      <p className="text-xs text-slate-500 mb-6">
        Defina as configurações abaixo para customizar o visual e as seções incluídas nos relatórios PDF, Word e Excel gerados de forma automática.
      </p>

      {/* Title & Subtitle customization */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="custom-title">
            Título Personalizado do Laudo
          </label>
          <input
            id="custom-title"
            type="text"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
            value={config.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Ex: LAUDO DE ERGONOMIA - OUTUBRO/2026"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="custom-subtitle">
            Subtítulo / Descrição
          </label>
          <input
            id="custom-subtitle"
            type="text"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
            value={config.subtitle}
            onChange={(e) => updateField('subtitle', e.target.value)}
            placeholder="Ex: Diagnóstico psicossocial individual para melhoria de postos de trabalho"
          />
        </div>
      </div>

      {/* Color theme selector */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-slate-500" /> Colorização do Tema (PDF/Word)
        </label>
        <div className="grid grid-cols-5 gap-2">
          {presetColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => updateField('themeColor', color.value)}
              className={`h-9 w-full rounded-xl relative cursor-pointer border transition-all ${
                config.themeColor === color.value
                  ? 'border-slate-800 ring-2 ring-slate-800/10 scale-105'
                  : 'border-transparent hover:scale-102'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {config.themeColor === color.value && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold bg-black/10 rounded-xl">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility Checkboxes */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
          <Layout className="w-3.5 h-3.5 text-slate-500" /> Configuração de Seções
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 select-none">
          <input
            type="checkbox"
            checked={config.showCharts}
            onChange={(e) => updateField('showCharts', e.target.checked)}
            className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          Incluir Indicadores e Gráficos de Resumo
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600 select-none">
          <input
            type="checkbox"
            checked={config.showDetailsTable}
            onChange={(e) => updateField('showDetailsTable', e.target.checked)}
            className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
          Incluir Tabela Completa de Respostas
        </label>
      </div>
    </div>
  );
}
