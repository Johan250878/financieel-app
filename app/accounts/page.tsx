import BalanceOverview from '../components/BalanceOverview'
import SavingsPots from '../components/SavingsPots'

export default function AccountsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <h1 className="text-3xl font-bold">Rekeningen</h1>

        <BalanceOverview />

        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Spaarrekening</h2>
          <SavingsPots />
        </section>
      </div>
    </main>
  )
}