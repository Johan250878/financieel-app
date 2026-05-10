import SavingsPots from './components/SavingsPots'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Financieel overzicht</h1>
          <p className="text-gray-500">
            Dashboard voor rekeningen, transacties en spaarpotjes.
          </p>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm border">
          <SavingsPots />
        </section>
      </div>
    </main>
  )
}