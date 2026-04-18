"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import TransactionForm from "../app/TransactionForm";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  type: "income" | "expense";
  user_id: string;
};

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
const totalIncome = transactions
  .filter((t) => t.type === "income")
  .reduce((sum, t) => sum + Number(t.amount), 0);

const totalExpense = transactions
  .filter((t) => t.type === "expense")
  .reduce((sum, t) => sum + Number(t.amount), 0);

const balance = totalIncome - totalExpense;
  
  useEffect(() => {
    async function loadPage() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (!session?.user) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      const { data, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("transaction_date", { ascending: false });

      if (txError) {
        setErrorMessage(txError.message);
      } else {
        setTransactions((data as Transaction[]) ?? []);
      }

      setLoading(false);
    }

    loadPage();
  }, [router]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return <main style={{ padding: 40 }}>Laden...</main>;
  }

  if (errorMessage) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Financieel overzicht</h1>
        <p style={{ color: "red" }}>Fout: {errorMessage}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Financieel overzicht</h1>

      <p>Ingelogd als: {user?.email}</p>
      <button onClick={handleLogout}>Uitloggen</button>

      <hr style={{ margin: "20px 0" }} />

      <TransactionForm />
<div style={{ marginBottom: 20 }}>
  <p>Inkomsten: € {totalIncome.toFixed(2)}</p>
  <p>Uitgaven: € {totalExpense.toFixed(2)}</p>
  <p><strong>Saldo: € {balance.toFixed(2)}</strong></p>
</div>
      <h2>Transacties</h2>

      {transactions.length === 0 && <p>Geen transacties</p>}

      {transactions.map((t) => (
        <div key={t.id} style={{ marginBottom: 12 }}>
          <strong>{t.description}</strong> - €{Number(t.amount).toFixed(2)}
          <div>{t.transaction_date}</div>
          <div>{t.type === "income" ? "Inkomst" : "Uitgave"}</div>
          <button onClick={() => handleDelete(t.id)} style={{ marginTop: 6 }}>
            Verwijder
          </button>
        </div>
      ))}
    </main>
  );
}
