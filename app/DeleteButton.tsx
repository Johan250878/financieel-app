'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type DeleteButtonProps = {
  id: string
}

export default function DeleteButton({ id }: DeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = window.confirm('Weet je zeker dat je deze transactie wilt verwijderen?')
    if (!confirmed) return

    setLoading(true)

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Fout bij verwijderen: ${error.message}`)
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        padding: '0.6rem 0.9rem',
        borderRadius: '8px',
        border: '1px solid #ccc',
        background: 'white',
        cursor: 'pointer',
        fontWeight: 'bold',
      }}
    >
      {loading ? 'Bezig...' : 'Verwijderen'}
    </button>
  )
}