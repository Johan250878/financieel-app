'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function BalanceOverview() {
  const supabase = createClient()

  const [balance, setBalance] = useState(0)
  const [potsTotal, setPotsTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error(userError)
        setLoading(false)
        return
      }

      const { data: savingsAccount, error: accountError } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('user_id', user.id)
        .eq('name', 'Spaarrekening')
        .single()

      if (accountError || !savingsAccount) {
        console.error(accountError)
        setLoading(false)
        return
      }

      const { data: pots, error: potsError } = await supabase
        .from('savings_pots')
        .select('current_amount')
        .eq('account_id', savingsAccount.id)

      if (potsError) {
        console.error(potsError)
      }

      const totalPots =
        pots?.reduce((sum, p) => {
          return sum + Number(p.current_amount || 0)
        }, 0) || 0

      setBalance(Number(savingsAccount.balance || 0))
      setPotsTotal(totalPots)

      setLoading(false)
    }

    fetchData()

    const handleRefresh = () => {
      fetchData()
    }

    window.addEventListener('savings-pots-updated', handleRefresh)

    return () => {
      window.removeEventListener('savings-pots-updated', handleRefresh)
    }
  }, [supabase])

  const free = balance - potsTotal

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-gray-500">Saldo laden...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Saldo spaarrekening</p>

        <p className="text-2xl font-bold">
          €{balance.toFixed(2)}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Vrij te besteden</p>

        <p className="text-2xl font-bold">
          €{free.toFixed(2)}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">In spaarpotjes</p>

        <p className="text-2xl font-bold">
          €{potsTotal.toFixed(2)}
        </p>
      </div>
    </div>
  )
}