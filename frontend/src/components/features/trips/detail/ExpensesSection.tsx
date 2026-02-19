import type { FormEvent } from 'react'
import type { Expense } from '../../../../api/expenses'
import type { Trip } from '../../../../api/trips'

interface ExpensesSectionProps {
  trip: Trip
  expenses: Expense[]
  totalExpenses: number
  canEditPlanning: boolean
  showExpenseForm: boolean
  amount: string
  currency: string
  expenseDesc: string
  expenseDate: string
  expenseError: string
  isCreatePending: boolean
  onShowForm: () => void
  onHideForm: () => void
  onAmountChange: (value: string) => void
  onCurrencyChange: (value: string) => void
  onExpenseDescChange: (value: string) => void
  onExpenseDateChange: (value: string) => void
  onAddExpense: (e: FormEvent<HTMLFormElement>) => void
  onDeleteExpense: (expenseId: string) => void
}

export function ExpensesSection({
  trip,
  expenses,
  totalExpenses,
  canEditPlanning,
  showExpenseForm,
  amount,
  currency,
  expenseDesc,
  expenseDate,
  expenseError,
  isCreatePending,
  onShowForm,
  onHideForm,
  onAmountChange,
  onCurrencyChange,
  onExpenseDescChange,
  onExpenseDateChange,
  onAddExpense,
  onDeleteExpense,
}: ExpensesSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Expenses</h2>
      <p className="text-sm text-slate-600 mb-3">Total: {totalExpenses.toFixed(2)}</p>

      {canEditPlanning && showExpenseForm ? (
        <form onSubmit={onAddExpense} className="mb-4 p-4 bg-white rounded-lg border border-slate-200 space-y-3">
          {expenseError && <div className="p-2 rounded-md bg-red-50 text-red-700 text-sm">{expenseError}</div>}
          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              required
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Description"
            value={expenseDesc}
            onChange={(e) => onExpenseDescChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          />
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => onExpenseDateChange(e.target.value)}
            min={trip.startDate}
            max={trip.endDate}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isCreatePending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={onHideForm}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : canEditPlanning ? (
        <button onClick={onShowForm} className="mb-4 text-sm text-primary-600 hover:underline">
          + Add expense
        </button>
      ) : (
        <p className="mb-4 text-sm text-slate-500">
          Read-only expenses view. Editors/owners (and pending invitees) can add expenses.
        </p>
      )}

      {expenses.length === 0 ? (
        <p className="text-slate-500 text-sm">No expenses yet.</p>
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center"
            >
              <div>
                <span className="font-medium">
                  {expense.currency} {expense.amount}
                </span>
                {expense.description && <p className="text-sm text-slate-500">{expense.description}</p>}
                <span className="text-xs text-slate-400">{expense.date}</span>
              </div>
              {canEditPlanning && (
                <button onClick={() => onDeleteExpense(expense.id)} className="text-red-600 text-sm hover:underline">
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
