import { useState, useEffect } from 'react'
import {
  getEmployees, getDepartments, createEmployee, updateEmployee, deleteEmployee,
  getLeaves, createLeave, updateLeaveStatus, getAttendance, logAttendance
} from '../services/api'
import Modal from '../components/Modal'
import { Plus, Edit2, Trash2, UserCheck, CalendarDays, Loader2, Search } from 'lucide-react'

const ROLES = ['Active', 'On Leave', 'Terminated']
const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Maternity', 'Unpaid']

export default function HRModule() {
  const [tab, setTab] = useState('employees')
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [leaves, setLeaves] = useState([])
  const [attendance, setAttendance] = useState([])
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
      const [empRes, deptRes, leaveRes, attRes] = await Promise.all([
        getEmployees(), getDepartments(), getLeaves(), getAttendance()
      ])
      setEmployees(empRes.data)
      setDepartments(deptRes.data)
      setLeaves(leaveRes.data)
      setAttendance(attRes.data)
    } catch (e) {}
    setLoading(false)
  }

  const openModal = (type, data = {}) => {
    setForm(data)
    setModal({ open: true, type, data })
    setMsg('')
  }

  const closeModal = () => setModal({ open: false, type: null, data: null })

  const handleSaveEmployee = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal.data?.id) {
        await updateEmployee(modal.data.id, form)
      } else {
        await createEmployee(form)
      }
      setMsg('✓ Employee saved successfully')
      await loadAll()
      setTimeout(closeModal, 1000)
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.detail || 'Error saving employee'))
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this employee? This action cannot be undone.')) return
    try {
      await deleteEmployee(id)
      await loadAll()
    } catch (err) { alert('Error deleting employee') }
  }

  const handleLeaveSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createLeave(form)
      setMsg('✓ Leave request submitted')
      await loadAll()
      setTimeout(closeModal, 1000)
    } catch (err) {
      setMsg('✗ ' + (err.response?.data?.detail || 'Error submitting leave'))
    }
    setSaving(false)
  }

  const handleLeaveStatus = async (id, status) => {
    try {
      await updateLeaveStatus(id, status)
      await loadAll()
    } catch (err) { alert('Error updating leave status') }
  }

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.emp_id.toLowerCase().includes(search.toLowerCase()) ||
    e.designation.toLowerCase().includes(search.toLowerCase())
  )

  const statusBadge = (status) => {
    const cls = { Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 'On Leave': 'bg-amber-500/10 text-amber-400 border-amber-500/20', Terminated: 'bg-red-500/10 text-red-400 border-red-500/20' }
    return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls[status] || 'bg-gray-500/10 text-gray-400'}`}>{status}</span>
  }

  const tabs = [
    { id: 'employees', label: 'Employees' },
    { id: 'leaves', label: 'Leave Requests' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'departments', label: 'Departments' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Tab Bar */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {tab === 'employees' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
                  className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-48" />
              </div>
              <button onClick={() => openModal('employee', { emp_id: `EMP-${Date.now().toString().slice(-4)}`, name: '', email: '', designation: '', joining_date: new Date().toISOString().split('T')[0], salary: 0, status: 'Active' })}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Employee
              </button>
            </>
          )}
          {tab === 'leaves' && (
            <button onClick={() => openModal('leave', { leave_type: 'Annual', start_date: '', end_date: '', status: 'Pending' })}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Leave Request
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
      ) : (
        <>
          {/* Employees Tab */}
          {tab === 'employees' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-800/50">
                      {['Emp ID', 'Name', 'Designation', 'Department', 'Salary', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map(emp => (
                      <tr key={emp.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-cyan-400">{emp.emp_id}</td>
                        <td className="px-4 py-3 font-medium text-white">{emp.name}<div className="text-xs text-gray-500">{emp.email}</div></td>
                        <td className="px-4 py-3 text-gray-300">{emp.designation}</td>
                        <td className="px-4 py-3 text-gray-400">{emp.department_name || '—'}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">${emp.salary.toLocaleString()}</td>
                        <td className="px-4 py-3">{statusBadge(emp.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openModal('employee', { ...emp, department_id: emp.department_id })}
                              className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDelete(emp.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No employees found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Leaves Tab */}
          {tab === 'leaves' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-800/50">
                      {['Employee', 'Type', 'From', 'To', 'Reason', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map(l => (
                      <tr key={l.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{l.employee_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{l.leave_type}</td>
                        <td className="px-4 py-3 text-gray-400">{l.start_date}</td>
                        <td className="px-4 py-3 text-gray-400">{l.end_date}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{l.reason || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${l.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : l.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{l.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {l.status === 'Pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleLeaveStatus(l.id, 'Approved')} className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/40">Approve</button>
                              <button onClick={() => handleLeaveStatus(l.id, 'Rejected')} className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40">Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {tab === 'attendance' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-800/50">
                      {['Employee', 'Date', 'Status', 'Check In', 'Check Out'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{a.employee_name}</td>
                        <td className="px-4 py-3 text-gray-300">{a.date}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${a.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{a.check_in || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{a.check_out || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Departments Tab */}
          {tab === 'departments' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map(d => (
                <div key={d.id} className="glass-card rounded-xl p-4">
                  <div className="font-semibold text-white text-sm">{d.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{d.description || 'No description'}</div>
                  <div className="text-xs text-cyan-400 mt-2">
                    {employees.filter(e => e.department_name === d.name).length} employees
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Employee Modal */}
      <Modal open={modal.open && modal.type === 'employee'} onClose={closeModal} title={modal.data?.id ? 'Edit Employee' : 'Add New Employee'}>
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded-lg ${msg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{msg}</div>}
        <form onSubmit={handleSaveEmployee} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Employee ID</label>
              <input value={form.emp_id || ''} onChange={e => setForm({ ...form, emp_id: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Full Name</label>
              <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Phone</label>
            <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Designation</label>
              <input value={form.designation || ''} onChange={e => setForm({ ...form, designation: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Department</label>
              <select value={form.department_id || ''} onChange={e => setForm({ ...form, department_id: parseInt(e.target.value) })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                <option value="">Select Dept</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Joining Date</label>
              <input type="date" value={form.joining_date || ''} onChange={e => setForm({ ...form, joining_date: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Annual Salary ($)</label>
              <input type="number" value={form.salary || ''} onChange={e => setForm({ ...form, salary: parseFloat(e.target.value) })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Employment Status</label>
            <select value={form.status || 'Active'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save Employee
            </button>
          </div>
        </form>
      </Modal>

      {/* Leave Modal */}
      <Modal open={modal.open && modal.type === 'leave'} onClose={closeModal} title="Submit Leave Request">
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded-lg ${msg.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{msg}</div>}
        <form onSubmit={handleLeaveSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Employee</label>
            <select value={form.employee_id || ''} onChange={e => setForm({ ...form, employee_id: parseInt(e.target.value) })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Leave Type</label>
            <select value={form.leave_type || 'Annual'} onChange={e => setForm({ ...form, leave_type: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
              {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">From Date</label>
              <input type="date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">To Date</label>
              <input type="date" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Reason (optional)</label>
            <textarea value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg flex items-center gap-2">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
