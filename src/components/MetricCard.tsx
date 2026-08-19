import React, { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: 'amber' | 'blue' | 'emerald' | 'purple' | 'rose' | 'slate';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'amber',
  onClick,
}) => {
  const colorMap = {
    amber: {
      bg: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    blue: {
      bg: 'from-sky-500/10 to-transparent border-sky-500/20 text-sky-400',
      iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    },
    emerald: {
      bg: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    purple: {
      bg: 'from-purple-500/10 to-transparent border-purple-500/20 text-purple-400',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    },
    rose: {
      bg: 'from-rose-500/10 to-transparent border-rose-500/20 text-rose-400',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    },
    slate: {
      bg: 'from-slate-800/40 to-transparent border-slate-700/50 text-slate-300',
      iconBg: 'bg-slate-800 text-slate-300 border border-slate-700',
    },
  }[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-b ${colorMap.bg} bg-slate-900/80 border p-5 transition-all duration-200 hover:border-slate-700 ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <h4 className="mt-2 text-2xl font-extrabold text-slate-100 tracking-tight">
            {value}
          </h4>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorMap.iconBg} shadow-inner`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span
            className={
              trend.isPositive !== false ? 'text-emerald-400' : 'text-rose-400'
            }
          >
            {trend.value}
          </span>
          <span className="text-slate-500">vs período anterior</span>
        </div>
      )}
    </div>
  );
};
