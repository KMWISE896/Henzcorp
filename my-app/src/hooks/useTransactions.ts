import { useState, useEffect } from 'react'
import { getUserTransactions, Transaction } from '../lib/supabase'
import { useAuth } from './useAuth'

export const useTransactions = (limit = 10) => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadTransactions()
    } else {
      setTransactions([])
      setLoading(false)
    }
  }, [user, limit])

  const loadTransactions = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const userTransactions = await getUserTransactions(user.id, limit)
      setTransactions(userTransactions)
    } catch (err) {
      console.error('Error loading transactions:', err)
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const formatTransactionForDisplay = (transaction: Transaction) => {
    const getIcon = () => {
      switch (transaction.transaction_type) {
        case 'deposit': return 'D'
        case 'withdrawal': return 'W'
        case 'buy_crypto': return 'B'
        case 'sell_crypto': return 'S'
        case 'transfer': return 'T'
        case 'airtime_purchase': return 'A'
        default: return 'T'
      }
    }

    const getIconColor = () => {
      switch (transaction.status) {
        case 'completed': return 'bg-green-500'
        case 'pending': return 'bg-yellow-500'
        case 'failed': return 'bg-red-500'
        case 'cancelled': return 'bg-gray-500'
        default: return 'bg-blue-500'
      }
    }

    const getTitle = () => {
      switch (transaction.transaction_type) {
        case 'deposit': return 'You deposited funds'
        case 'withdrawal': return 'You withdrew funds'
        case 'buy_crypto': return `You bought ${transaction.currency}`
        case 'sell_crypto': return `You sold ${transaction.currency}`
        case 'transfer': return `You sent ${transaction.currency}`
        case 'airtime_purchase': return 'You purchased Airtime'
        default: return 'Transaction'
      }
    }

    return {
      id: transaction.id,
      type: transaction.transaction_type,
      title: getTitle(),
      amount: `${transaction.currency} ${transaction.amount.toLocaleString()}`,
      description: transaction.description || '',
      time: new Date(transaction.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }),
      icon: getIcon(),
      iconColor: getIconColor(),
      status: transaction.status
    }
  }

  return {
    transactions,
    loading,
    error,
    refreshTransactions: loadTransactions,
    formatTransactionForDisplay
  }
}