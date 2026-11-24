import React from 'react';
import { QrCode, BarChart3, Database, Layers } from 'lucide-react';

export default function StatsCards({ stats = {} }) {
  const cards = [
    {
      title: 'Total QR Codes',
      value: stats.totalQRs ?? 0,
      description: 'Saved permanently in database',
      icon: QrCode,
      color: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-400',
      bgGlow: 'bg-blue-500/10'
    },
    {
      title: 'Total Scans / Clicks',
      value: stats.totalScans ?? 0,
      description: 'Redirects & activity tracked',
      icon: BarChart3,
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-400',
      bgGlow: 'bg-emerald-500/10'
    },
    {
      title: 'Active Associated URLs',
      value: stats.totalQRs ?? 0,
      description: 'Never reset across sessions',
      icon: Database,
      color: 'from-violet-500 to-purple-500',
      textColor: 'text-violet-400',
      bgGlow: 'bg-violet-500/10'
    },
    {
      title: 'Categories',
      value: stats.categoriesCount ?? 0,
      description: 'Organized collections',
      icon: Layers,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-400',
      bgGlow: 'bg-amber-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bgGlow} ${card.textColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">
              {card.value}
            </div>
            <p className="text-xs text-slate-500 flex items-center">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
