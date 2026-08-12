import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token')
      localStorage.removeItem('erp_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const login = (data) => API.post('/auth/login', data)
export const register = (data) => API.post('/auth/register', data)
export const getMe = () => API.get('/auth/me')

// Dashboard
export const getDashboardSummary = () => API.get('/dashboard/summary')

// HR
export const getDepartments = () => API.get('/hr/departments')
export const createDepartment = (data) => API.post('/hr/departments', data)
export const getEmployees = () => API.get('/hr/employees')
export const createEmployee = (data) => API.post('/hr/employees', data)
export const updateEmployee = (id, data) => API.put(`/hr/employees/${id}`, data)
export const deleteEmployee = (id) => API.delete(`/hr/employees/${id}`)
export const getAttendance = () => API.get('/hr/attendance')
export const logAttendance = (data) => API.post('/hr/attendance', data)
export const getLeaves = () => API.get('/hr/leaves')
export const createLeave = (data) => API.post('/hr/leaves', data)
export const updateLeaveStatus = (id, status) => API.put(`/hr/leaves/${id}/status?status=${status}`)

// Inventory
export const getCategories = () => API.get('/inventory/categories')
export const createCategory = (data) => API.post('/inventory/categories', data)
export const getSuppliers = () => API.get('/inventory/suppliers')
export const createSupplier = (data) => API.post('/inventory/suppliers', data)
export const getProducts = () => API.get('/inventory/products')
export const createProduct = (data) => API.post('/inventory/products', data)
export const updateProduct = (id, data) => API.put(`/inventory/products/${id}`, data)
export const deleteProduct = (id) => API.delete(`/inventory/products/${id}`)
export const adjustStock = (data) => API.post('/inventory/stock-adjust', data)

// Sales
export const getSalesOrders = () => API.get('/sales/orders')
export const createSalesOrder = (data) => API.post('/sales/orders', data)
export const updateOrderStatus = (id, status) => API.put(`/sales/orders/${id}/status?status=${status}`)

// Procurement
export const getPurchaseOrders = () => API.get('/procurement/orders')
export const createPurchaseOrder = (data) => API.post('/procurement/orders', data)
export const receivePurchaseOrder = (id) => API.put(`/procurement/orders/${id}/receive`)

// Finance
export const getTransactions = () => API.get('/finance/transactions')
export const createTransaction = (data) => API.post('/finance/transactions', data)
export const getFinancialSummary = () => API.get('/finance/summary')

// Customers
export const getCustomers = () => API.get('/customers')
export const createCustomer = (data) => API.post('/customers', data)
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data)
export const deleteCustomer = (id) => API.delete(`/customers/${id}`)

// Reports
export const getReports = (range) => API.get(`/reports/analytics?range_filter=${range}`)

// Notifications
export const getNotifications = () => API.get('/notifications')
export const markNotifRead = (id) => API.put(`/notifications/${id}/read`)

export default API
