'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

import BalanceOverview from '../components/BalanceOverview'
import SavingsPots from '../components/SavingsPots'

type Account = {
  id: string
  name: string
  starting_balance: number | null
  balance: number | null
}

type Transaction = {
  id: string
  amount: number | null
  type: 'income' | 'expense'
  account_id: string | null
}

export default function AccountsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name, starting_balance, balance')
        .order('name')

      if (accountsError) {
        console.error(accountsError)
      }

      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from('transactions')
          .select('id, amount, type, account_id')

      if (transactionsError) {
        console.error(transactionsError)
      }

      setAccounts(accountsData || [])
      setTransactions(transactionsData || [])
      setLoading(false)
    }

    fetchData()
  }, [router, supabase])

  const getAccountActualBalance = (account: Account) => {
    if (account.name === 'Spaarrekening') {
      return Number(account.balance || 0)
    }

    const start = Number(account.starting_balance || 0)

    const txTotal = transactions
      .filter((tx) => tx.account_id === account.id)
      .reduce((sum, tx) => {
        const amount = Number(tx.amount || 0)

        if (tx.type === 'income') {
          return sum + amount
        }

        if (tx.type === 'expense') {
          return sum - amount
        }

        return sum
      }, 0)

    return start + txTotal
  }

  const paymentAccounts = accounts.filter(
    (account) => account.name !== 'Spaarrekening'
  )

  const totalPaymentBalance = useMemo(() => {
    return paymentAccounts.reduce(
      (sum, account) => sum + getAccountActualBalance(account),
      0
    )
  }, [paymentAccounts, transactions])

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Rekeningen</h1>

            <p className="text-gray-500">
              Overzicht van betaalrekeningen, spaarrekening en spaarpotjes.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
          >
            Uitloggen
          </button>
        </div>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Betaalrekeningen</h2>

              <p className="text-sm text-gray-500">
                Saldo = startsaldo + inkomsten - uitgaven
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                Totaal betaalrekeningen
              </p>

              <p className="text-2xl font-bold">
                €{totalPaymentBalance.toFixed(2)}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Laden...</p>
          ) : paymentAccounts.length === 0 ? (
            <p className="text-gray-500">
              Geen betaalrekeningen gevonden.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {paymentAccounts.map((account) => {
                const actualBalance = getAccountActualBalance(account)

                return (
                  <div
                    key={account.id}
                    className="rounded-xl border bg-gray-50 p-4"
                  >
                    <p className="text-sm text-gray-500">{account.name}</p>

                    <p className="mt-2 text-2xl font-bold">
                      €{actualBalance.toFixed(2)}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Startsaldo: €
                      {Number(account.starting_balance || 0).toFixed(2)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">Spaarrekening</h2>

            <p className="text-sm text-gray-500">
              Vrij te besteden = saldo spaarrekening - totaal in spaarpotjes
            </p>
          </div>

          <BalanceOverview />

          <SavingsPots />
        </section>
      </div>
    </main>
  )
}