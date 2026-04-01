"use client";
import { supabase } from '../lib/supabase'
import TransactionForm from './TransactionForm'
import DeleteButton from './DeleteButton'

export default async function Home() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })

  if (error) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
        <h1>Financieel overzicht</h1>
        <p>Fout: {error.message}</p>
      </main>
    )
  }

  const transactions = data ?? []

  const totalIncome = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const totalExpense = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const balance = totalIncome - totalExpense

  return (
    <main
      style={{
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ marginBottom: '2rem' }}>Financieel overzicht</h1>

      {/* Formulier */}
      <TransactionForm />

      {/* Overzicht */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '12px',
            minWidth: '200px',
          }}
        >
          <h2>Inkomsten</h2>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            € {totalIncome.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '12px',
            minWidth: '200px',
          }}
        >
          <h2>Uitgaven</h2>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            € {totalExpense.toFixed(2)}
          </p>
        </div>

        <div
          style={{
            padding: '1rem',
            border: '1px solid #ddd',
            borderRadius: '12px',
            minWidth: '200px',
          }}
        >
          <h2>Saldo</h2>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            € {balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Lijst */}
      <h2 style={{ marginBottom: '1rem' }}>Transacties</h2>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {transactions.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                {item.description}
              </p>
              <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>
                {item.transaction_date}
              </p>
              <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>
                {item.type === 'income' ? 'Inkomst' : 'Uitgave'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {item.type === 'income' ? '+' : '-'} €{' '}
                {Number(item.amount).toFixed(2)}
              </div>

              <DeleteButton id={item.id} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}