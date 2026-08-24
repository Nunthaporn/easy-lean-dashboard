import axios from 'axios'
import type { FactoryEff, FilterMeta, LatestLine, PeriodFactory, Summary } from '../types/dashboard'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001' })

export const getFilters = () => api.get<FilterMeta>('/api/easylean/filters').then(r => r.data)
export const getHealth = () => api.get<{database:string}>('/api/easylean/health').then(r => r.data)

const qp = (startDate:string, endDate:string, factory:string) => ({
  start_date: startDate,
  end_date: endDate,
  ...(factory !== 'ALL' ? { factory } : {})
})

export const getDashboard = async (startDate:string, endDate:string, factory:string) => {
  const params = qp(startDate, endDate, factory)
  const [summary, monthly, latest, monthlyFactory, last10] = await Promise.all([
    api.get<Summary>('/api/easylean/summary', { params }),
    api.get<FactoryEff[]>('/api/easylean/monthly-by-line', { params }),
    api.get<LatestLine[]>('/api/easylean/latest-by-line', { params }),
    api.get<PeriodFactory[]>('/api/easylean/monthly-by-factory', { params }),
    api.get<PeriodFactory[]>('/api/easylean/last-10-days', { params }),
  ])
  return { summary: summary.data, monthly: monthly.data, latest: latest.data, monthlyFactory: monthlyFactory.data, last10: last10.data }
}
