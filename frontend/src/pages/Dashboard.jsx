import { useState, useEffect } from 'react'
import MetricCard from '../components/MetricCard'
import { getDashboardSummary } from '../services/api'
import {
  Users, Package, TrendingUp, ShoppingCart, Truck,
  DollarSign, AlertTriangle, Activity, Loader2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#f43f5e']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await getDashboardSummary()
      setData(res.data)
    } catch (e) {
      setError('Failed to load dashboard data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
    </div>
  )

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-6 text-center">
      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
      {error}
    </div>
  )

  const fmt = (v) => typeof v === 'number' ? (v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v.toFixed(0)}`) : v

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Employees" value={data.total_employees} icon={Users} color="indigo" />
        <MetricCard title="Total Products" value={data.total_products} icon={Package} color="cyan" />
        <MetricCard title="Inventory Value" value={fmt(data.total_inventory_value)} icon={TrendingUp} color="emerald" />
        <MetricCard title="Total Revenue" value={fmt(data.total_sales_revenue)} icon={DollarSign} color="violet" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Pending Purchases" value={data.pending_purchases_count} icon={Truck} color="amber" />
        <MetricCard title="Total Expenses" value={fmt(data.total_expenses)} icon={ShoppingCart} color="rose" />
        <MetricCard title="Net Profit" value={fmt(data.net_profit)} icon={Activity} color={data.net_profit >= 0 ? 'emerald' : 'rose'} />
        <MetricCard title="Low Stock Alerts" value={data.low_stock_count} icon={AlertTriangle} color={data.low_stock_count > 0 ? 'amber' : 'emerald'} subtitle={data.low_stock_count > 0 ? 'Needs reorder' : 'All stocked'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expense Bar Chart */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 font-heading">Financial Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.sales_chart_data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: 8, color: '#f9fafb' }} />
              <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Pie Chart */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 font-heading">Stock Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.inventory_chart_data}
                dataKey="quantity"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.inventory_chart_data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: 8, color: '#f9fafb' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 font-heading">Recent Financial Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-800">
                <th className="text-left pb-3 font-medium">TRX No</th>
                <th className="text-left pb-3 font-medium">Category</th>
                <th className="text-left pb-3 font-medium">Description</th>
                <th className="text-left pb-3 font-medium">Date</th>
                <th className="text-right pb-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_transactions.map(t => (
                <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 font-mono text-xs text-cyan-400">{t.trx_no}</td>
                  <td className="py-3 text-gray-300">{t.category}</td>
                  <td className="py-3 text-gray-400 text-xs max-w-xs truncate">{t.description}</td>
                  <td className="py-3 text-gray-400 text-xs">{t.date}</td>
                  <td className={`py-3 text-right font-semibold ${t.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'Income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
