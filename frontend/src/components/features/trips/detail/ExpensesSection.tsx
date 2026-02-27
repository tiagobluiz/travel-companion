import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
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
    <Box component="section" sx={{ mb: 4.5 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(15,23,42,0.06)',
          bgcolor: 'rgba(255,255,255,0.92)',
          p: { xs: 1.75, md: 2 },
        }}
      >
        <Stack spacing={1.75}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack spacing={0.4}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    bgcolor: 'rgba(21,112,239,0.10)',
                    color: 'primary.main',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <ReceiptLongRoundedIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#223046' }}>
                  Expenses
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Track trip costs and keep shared spending transparent.
              </Typography>
            </Stack>

            <Box sx={{ px: 1.1, py: 0.6, borderRadius: 1.75, bgcolor: 'rgba(15,23,42,0.05)', color: '#344054' }}>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                Total: {totalExpenses.toFixed(2)}
              </Typography>
            </Box>
          </Stack>

          {canEditPlanning && showExpenseForm ? (
            <Paper
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2.5, borderColor: 'rgba(15,23,42,0.08)', bgcolor: 'rgba(248,250,252,0.75)' }}
            >
              <Stack component="form" onSubmit={onAddExpense} spacing={1.2}>
                {expenseError ? (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {expenseError}
                  </Alert>
                ) : null}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    label="Amount"
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    required
                    fullWidth
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: 40 } }}
                  />
                  <TextField
                    select
                    label="Currency"
                    value={currency}
                    onChange={(e) => onCurrencyChange(e.target.value)}
                    size="small"
                    sx={{ minWidth: { xs: '100%', sm: 130 }, '& .MuiInputBase-root': { height: 40 } }}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                  </TextField>
                </Stack>
                <TextField
                  label="Description"
                  value={expenseDesc}
                  onChange={(e) => onExpenseDescChange(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  type="date"
                  label="Date"
                  value={expenseDate}
                  onChange={(e) => onExpenseDateChange(e.target.value)}
                  inputProps={{ min: trip.startDate, max: trip.endDate }}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                  size="small"
                />
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained" disabled={isCreatePending}>
                    Add
                  </Button>
                  <Button type="button" variant="text" onClick={onHideForm}>
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : canEditPlanning ? (
            <Button onClick={onShowForm} variant="contained" startIcon={<AddRoundedIcon />} sx={{ width: 'fit-content' }}>
              + Add expense
            </Button>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2.5 }}>
              Read-only expenses view. Only editors and owners can add expenses.
            </Alert>
          )}

          {expenses.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Typography variant="body2" color="text.secondary">
                No expenses yet.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={0.9}>
              {expenses.map((expense) => (
                <Paper
                  key={expense.id}
                  variant="outlined"
                  sx={{ p: 1.2, borderRadius: 2.25, borderColor: 'rgba(15,23,42,0.08)', bgcolor: 'rgba(255,255,255,0.96)' }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Stack spacing={0.3}>
                      <Typography sx={{ fontWeight: 800, color: '#223046' }}>
                        {expense.currency} {expense.amount}
                      </Typography>
                      {expense.description ? (
                        <Typography variant="body2" color="text.secondary">
                          {expense.description}
                        </Typography>
                      ) : null}
                      <Typography variant="caption" sx={{ color: '#667085' }}>
                        {expense.date}
                      </Typography>
                    </Stack>
                    {canEditPlanning ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutlineRoundedIcon />}
                        onClick={() => onDeleteExpense(expense.id)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
