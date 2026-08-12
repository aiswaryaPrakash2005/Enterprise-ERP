import { useState, useEffect } from 'react'
import { getSalesOrders, createSalesOrder, updateOrderStatus, getCustomers, getProducts } from '../services/api'
import Modal from '../components/Modal'
import { Plus, Loader2, Search, Trash2 } from 'lucide-react'

export default function SalesModule() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ customer_id: '', items: [] })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [oRes, cRes, pRes] = await Promise.all([getSalesOrders(), getCustomers(), getProducts()])
      setOrders(oRes.data)
      setCustomers(cRes.data)
      setProducts(pRes.data)
    } catch (e) {}
    setLoading(false)
  }

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0 }] }))
  
  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))
  
  const updateItem = (idx, field, value) => {
    const items = [...form.items]
    items[idx] = { ...items[idx], [field]: value }
    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value))
      if (prod) items[idx].unit_price = prod.selling_price
    }
    setForm(prev => ({ ...prev, items }))
  }

  const total = form.items.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.items.length) { setMsg('✗ Add at least one order item'); return }
    setSaving(true)
    setMsg('')
    try {
      await createSalesOrder({ customer_id: parseInt(form.customer_id), items: form.items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity), unit_price: parseFloat(i.unit_price) })) })
      setMsg('✓ Sales order created! Stock and finances auto-updated.')
      await loadAll()
      setTimeout(() => { setModal(false); setForm({ customer_id: '', items: [] }); setMsg('') }, 1500)
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.detail || 'Error creating order'))
    }
    setSaving(false)
  }

  const statusColor = (s) => ({ Completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Processing: 'text-blue-400 bg-blue-500/10 border-blue-500/20', Pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20', Cancelled: 'text-red-400 bg-red-500/10 border-red-500/20', Shipped: 'text-violet-400 bg-violet-500/10 border-violet-500/20' }[s] || 'text-gray-400')

  const filtered = orders.filter(o => o.order_no.includes(search) || (o.customer_name || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500" />
        </div>
        <button onClick={() => { setModal(true); setMsg('') }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-4 py-2 rounded-lg ml-auto">
          <Plus className="w-4 h-4" /> New Sales Order
        </button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div> : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-800/50">
                  {['Order No', 'Customer', 'Date', 'Amount', 'Invoice', 'Status', 'Update Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-cyan-400">{o.order_no}</td>
                    <td className="px-4 py-3 font-medium text-white">{o.customer_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{o.order_date}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">${o.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.invoice_no || '—'}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(o.status)}`}>{o.status}</span></td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value).then(loadAll)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500">
                        {['Pending', 'Processing', 'Shipped', 'Delivered', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No sales orders found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Create Sales Order" size="lg">
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded-lg ${msg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{msg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Customer</label>
            <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">Order Items</label>
              <button type="button" onClick={addItem} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                  <select value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)} className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>)}
                  </select>
                  <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} placeholder="Qty" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                  <div className="flex items-center gap-1">
                    <input type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} placeholder="Price" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                    <button type="button" onClick={() => removeItem(idx)} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {form.items.length === 0 && <div className="text-xs text-gray-500 text-center py-3 border border-dashed border-gray-700 rounded-lg">No items added yet. Click + Add Item.</div>}
            </div>
          </div>

          {form.items.length > 0 && (
            <div className="flex justify-end">
              <div className="text-sm font-semibold text-white">Order Total: <span className="text-emerald-400">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
