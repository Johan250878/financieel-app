'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Account = {
  id: string
  name: string
}

export default function TransactionForm() {
  const router = useRouter()

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [accountId, setAccountId] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadAccounts() {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        setMessage(`Fout bij laden rekeningen: ${error.message}`)
        return
      }

      if (data) {
        setAccounts(data)
      }
    }

    loadAccounts()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      setMessage('Fout: je bent niet ingelogd')
      setLoading(false)
      return
    }

    if (!accountId) {
      setMessage('Kies eerst een rekening')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('transactions').insert([
      {
        description,
        amount: Number(amount),
        type,
        transaction_date: transactionDate,
        household_id: 'a604e10c-4628-4e97-9b64-038be46e0fdd',
        created_by: session.user.id,
        user_id: session.user.id,
        account_id: accountId,
        category_id: 'acec54c1-1143-426e-97e4-baccf2e62da9',
      },
    ])

    if (error) {
      setMessage(`Fout: ${error.message}`)
      setLoading(false)
      return
    }

    setDescription('')
    setAmount('')
    setType('expense')
    setTransactionDate(new Date().toISOString().split('T')[0])
    setAccountId('')
    setMessage('Transactie opgeslagen')

    setLoading(false)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '2rem',
        display: 'grid',
        gap: '1rem',
      }}
    >
      <h2 style={{ margin: 0 }}>Nieuwe transactie</h2>

      <input
        type="text"
        placeholder="Omschrijving"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        style={{
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      />

      <input
        type="number"
        step="0.01"
        placeholder="Bedrag"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        style={{
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={{
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      >
        <option value="expense">Uitgave</option>
        <option value="income">Inkomst</option>
      </select>

      <select
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        required
        style={{
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      >
        <option value="">Kies een rekening</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={transactionDate}
        onChange={(e) => setTransactionDate(e.target.value)}
        required
        style={{
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '0.9rem 1rem',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        {loading ? 'Opslaan...' : 'Transactie toevoegen'}
      </button>

      {message && <p style={{ margin: 0 }}>{message}</p>}
    </form>
  )
}
