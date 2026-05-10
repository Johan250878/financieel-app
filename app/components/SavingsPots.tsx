'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type SavingsPot = {
  id: string
  name: string
  current_amount: number | null
  target_amount: number | null
}

type SavingsAccount = {
  id: string
}

export default function SavingsPots() {
  const supabase = createClient()

  const [pots, setPots] = useState<SavingsPot[]>([])
  const [savingsAccount, setSavingsAccount] = useState<SavingsAccount | null>(
    null
  )

  const [name, setName] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const notifyOverview = () => {
    window.dispatchEvent(new Event('savings-pots-updated'))
  }

  const getSavingsAccount = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error(userError)
      return null
    }

    const { data, error } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', 'Spaarrekening')
      .single()

    if (error || !data) {
      console.error(error)
      return null
    }

    return data
  }

  const fetchPots = async (accountId?: string) => {
    const activeAccountId = accountId || savingsAccount?.id

    if (!activeAccountId) return

    const { data, error } = await supabase
      .from('savings_pots')
      .select('id, name, current_amount, target_amount')
      .eq('account_id', activeAccountId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setPots(data || [])
  }

  useEffect(() => {
    const initialize = async () => {
      const account = await getSavingsAccount()

      if (!account) return

      setSavingsAccount(account)
      await fetchPots(account.id)
    }

    initialize()
  }, [])

  const addPot = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return
    if (!savingsAccount) return

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

    const { error } = await supabase.from('savings_pots').insert({
      user_id: user.id,
      account_id: savingsAccount.id,
      name: name.trim(),
      current_amount: currentAmount ? Number(currentAmount) : 0,
      target_amount: targetAmount ? Number(targetAmount) : null,
    })

    if (error) {
      console.error(error)
    } else {
      setName('')
      setCurrentAmount('')
      setTargetAmount('')
      await fetchPots(savingsAccount.id)
      notifyOverview()
    }

    setLoading(false)
  }

  const updatePotAmount = async (
    pot: SavingsPot,
    direction: 'add' | 'subtract'
  ) => {
    const amount = Number(amounts[pot.id])
    if (!amount || amount <= 0) return

    const current = pot.current_amount ?? 0
    const newPotAmount =
      direction === 'add' ? current + amount : current - amount

    if (newPotAmount < 0) {
      alert('Een spaarpotje kan niet onder €0 komen.')
      return
    }

    const { error } = await supabase
      .from('savings_pots')
      .update({ current_amount: newPotAmount })
      .eq('id', pot.id)

    if (error) {
      console.error(error)
      return
    }

    setAmounts((prev) => ({ ...prev, [pot.id]: '' }))
    await fetchPots()
    notifyOverview()
  }

  const deletePot = async (pot: SavingsPot) => {
    const confirmDelete = confirm(`Spaarpotje "${pot.name}" verwijderen?`)
    if (!confirmDelete) return

    const { error } = await supabase
      .from('savings_pots')
      .delete()
      .eq('id', pot.id)

    if (error) {
      console.error(error)
      return
    }

    await fetchPots()
    notifyOverview()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Spaarpotjes</h2>
      </div>

      <form onSubmit={addPot} className="grid gap-3 md:grid-cols-4">
        <input
          className="rounded-xl border p-3"
          placeholder="Naam"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="rounded-xl border p-3"
          placeholder="Startbedrag"
          type="number"
          step="0.01"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(e.target.value)}
        />

        <input
          className="rounded-xl border p-3"
          placeholder="Doel"
          type="number"
          step="0.01"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading || !savingsAccount}
          className="rounded-xl bg-black p-3 text-white disabled:opacity-50"
        >
          {loading ? 'Toevoegen...' : 'Toevoegen'}
        </button>
      </form>

      <div className="grid gap-4">
        {pots.map((pot) => {
          const current = pot.current_amount ?? 0
          const target = pot.target_amount ?? 0
          const progress =
            target > 0 ? Math.min((current / target) * 100, 100) : 0

          return (
            <div key={pot.id} className="rounded-2xl border p-4 shadow-sm">
              <div className="flex justify-between gap-4">
                <span className="font-medium">{pot.name}</span>

                <button
                  type="button"
                  onClick={() => deletePot(pot)}
                  className="text-sm text-red-500"
                >
                  Verwijder
                </button>
              </div>

              <div className="mt-2">
                €{current.toFixed(2)} / €{target.toFixed(2)}
              </div>

              <div className="mt-3 h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  className="flex-1 rounded-xl border p-2"
                  placeholder="Bedrag"
                  type="number"
                  step="0.01"
                  value={amounts[pot.id] || ''}
                  onChange={(e) =>
                    setAmounts((prev) => ({
                      ...prev,
                      [pot.id]: e.target.value,
                    }))
                  }
                />

                <button
                  type="button"
                  onClick={() => updatePotAmount(pot, 'add')}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-white"
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={() => updatePotAmount(pot, 'subtract')}
                  className="rounded-xl border px-4 py-2"
                >
                  -
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}