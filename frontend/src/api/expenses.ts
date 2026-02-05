import { api } from './client'

export interface Expense {
  id: string
  tripId: string
  amount: string
  currency: string
  description: string
  date: string
  createdAt: string
}

export interface CreateExpenseRequest {
  amount: number
  currency: string
  description?: string
  date: string
}

export async function fetchExpenses(tripId: string) {
  return api.get<Expense[]>(`/trips/${tripId}/expenses`)
}

export async function createExpense(tripId: string, data: CreateExpenseRequest) {
  return api.post<Expense>(`/trips/${tripId}/expenses`, data)
}

export async function updateExpense(
  tripId: string,
  expenseId: string,
  data: Partial<CreateExpenseRequest>
) {
  const body: Record<string, unknown> = { ...data }
  if (data.amount != null) body.amount = String(data.amount)
  return api.put<Expense>(`/trips/${tripId}/expenses/${expenseId}`, body)
}

export async function deleteExpense(tripId: string, expenseId: string) {
  return api.delete(`/trips/${tripId}/expenses/${expenseId}`)
}
