import { useState, useEffect } from 'react'
import { getProducts, getCategories, getSuppliers, createProduct, updateProduct, deleteProduct, adjustStock } from '../services/api'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Search, Loader2, AlertTriangle } from 'lucide-react'

export default function InventoryModule() {
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, type: null, data: null })
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pRes, cRes, sRes] = await Promise.all([getProducts(), getCategories(), getSuppliers()])
      setProducts(pRes.data)
      setCategories(cRes.data)
      setSuppliers(sRes.data)
    } catch (e) {}
    setLoading(false)
  }

  const openModal = (type, data = {}) => {
    setForm(data)
    setModal({ open: true, type, data })
    setMsg('')
  }

  const closeModal = () => setModal({ open: false, type: null, data: null })

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.data?.id) {
        await updateProduct(modal.data.id, form)
      } else {
        await createProduct(form)
      }
      setMsg('✓ Product saved successfully')
      await loadAll()
      setTimeout(closeModal, 1000)
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.detail || 'Error saving product'))
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try { await deleteProduct(id); await loadAll() } catch (e) { alert('Error deleting product') }
  }

  const handleStockAdjust = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adjustStock(form)
      setMsg('✓ Stock adjusted successfully')
      await loadAll()
      setTimeout(closeModal, 1000)
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.detail || 'Error adjusting stock'))
    }
    setSaving(false)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = products.filter(p => p.stock_quantity <= p.min_stock_level)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-400">Low Stock Warning ({lowStock.length} products)</div>
            <div className="text-xs text-amber-300/70 mt-0.5">{lowStock.map(p => p.name).join(', ')}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
        {['products', 'categories', 'suppliers'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${tab === t ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {tab === 'products' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                  className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-48" />
              </div>
              <button onClick={() => openModal('product', { sku: `SKU-${Date.now().toString().slice(-6)}`, name: '', stock_quantity: 0, min_stock_level: 5, purchase_price: 0, selling_price: 0, unit: 'pcs' })}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-3 py-1.5 rounded-lg">
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
      ) : (
        <>
          {tab === 'products' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-800/50">
                      {['SKU', 'Name', 'Category', 'Supplier', 'Stock', 'Min Level', 'Buy Price', 'Sell Price', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-cyan-400">{p.sku}</td>
                        <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                        <td className="px-4 py-3 text-gray-400">{p.category_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{p.supplier_name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${p.stock_quantity <= p.min_stock_level ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {p.stock_quantity} {p.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{p.min_stock_level}</td>
                        <td className="px-4 py-3 text-gray-300">${p.purchase_price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">${p.selling_price.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openModal('stock', { product_id: p.id, adjustment_type: 'STOCK_IN', quantity: 0 })}
                              title="Adjust Stock" className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400">
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openModal('product', { ...p })}
                              className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-400">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No products found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'categories' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(c => (
                <div key={c.id} className="glass-card rounded-xl p-4">
                  <div className="font-semibold text-white text-sm">{c.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{c.description || 'No description'}</div>
                  <div className="text-xs text-cyan-400 mt-2">{products.filter(p => p.category_name === c.name).length} products</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'suppliers' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-800/50">
                      {['Name', 'Contact Person', 'Email', 'Phone', 'Products'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                        <td className="px-4 py-3 text-gray-300">{s.contact_person || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{s.email || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{s.phone || '—'}</td>
                        <td className="px-4 py-3 text-cyan-400">{products.filter(p => p.supplier_name === s.name).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      <Modal open={modal.open && modal.type === 'product'} onClose={closeModal} title={modal.data?.id ? 'Edit Product' : 'Add New Product'}>
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded-lg ${msg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{msg}</div>}
        <form onSubmit={handleSaveProduct} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">SKU</label>
              <input value={form.sku || ''} onChange={e => setForm({ ...form, sku: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Product Name</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Category</label>
              <select value={form.category_id || ''} onChange={e => setForm({ ...form, category_id: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Supplier</label>
              <select value={form.supplier_id || ''} onChange={e => setForm({ ...form, supplier_id: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Initial Stock</label>
              <input type="number" value={form.stock_quantity || 0} onChange={e => setForm({ ...form, stock_quantity: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Min Stock Level</label>
              <input type="number" value={form.min_stock_level || 5} onChange={e => setForm({ ...form, min_stock_level: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Unit</label>
              <input value={form.unit || 'pcs'} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Purchase Price ($)</label>
              <input type="number" step="0.01" value={form.purchase_price || 0} onChange={e => setForm({ ...form, purchase_price: parseFloat(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Selling Price ($)</label>
              <input type="number" step="0.01" value={form.selling_price || 0} onChange={e => setForm({ ...form, selling_price: parseFloat(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal open={modal.open && modal.type === 'stock'} onClose={closeModal} title="Adjust Stock Level" size="sm">
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded-lg ${msg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{msg}</div>}
        <form onSubmit={handleStockAdjust} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Adjustment Type</label>
            <select value={form.adjustment_type || 'STOCK_IN'} onChange={e => setForm({ ...form, adjustment_type: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="ADJUSTMENT">Set Quantity</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Quantity</label>
            <input type="number" value={form.quantity || 0} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Notes (optional)</label>
            <input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Adjust
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
