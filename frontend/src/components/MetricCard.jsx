export default function MetricCard({ title, value, icon: Icon, color = 'cyan', trend, subtitle }) {
  const colorMap = {
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/10 to-rose-600/5 border-rose-500/20 text-rose-400',
    violet: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 text-violet-400',
  }

  const colors = colorMap[color] || colorMap.cyan

  return (
    <div className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${colors} border animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-white mt-1 font-heading">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && <p className="text-xs text-emerald-400 mt-1.5 font-medium">{trend}</p>}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center border`}>
            <Icon className={`w-5 h-5 ${colors.split(' ').find(c => c.startsWith('text-'))}`} />
          </div>
        )}
      </div>
    </div>
  )
}
