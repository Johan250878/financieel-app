'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const ACCOUNT_ID = '4e219e66-d890-4cf4-8a04-a95a13ed4581'

export default function BalanceOverview() {
  const supabase = createClient()

  const [balance, setBalance] = useState(0)
  const [potsTotal, setPotsTotal] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', ACCOUNT_ID)
        .single()

      if (accountError) {
        console.error(accountError)
      }

      const { data: pots, error: potsError } = await supabase
        .from('savings_pots')
        .select('current_amount')
        .eq('account_id', ACCOUNT_ID)

      if (potsError) {
        console.error(potsError)
      }

      const totalPots =
        pots?.reduce((sum, p) => sum + Number(p.current_amount || 0), 0) || 0

      setBalance(Number(account?.balance || 0))
      setPotsTotal(totalPots)
    }

    fetchData()
  }, [])

  const free = balance - potsTotal

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Saldo spaarrekening</p>
        <p className="text-2xl font-bold">€{balance.toFixed(2)}</p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Vrij te besteden</p>
        <p className="text-2xl font-bold">€{free.toFixed(2)}</p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">In spaarpotjes</p>
        <p className="text-2xl font-bold">€{potsTotal.toFixed(2)}</p>
      </div>
    </div>
  )
}