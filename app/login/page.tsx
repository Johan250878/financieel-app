"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPage() {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setErrorMessage(userError.message);
        setLoading(false);
        return;
      }

      if (!userData.user) {
        router.push("/login");
        return;
      }

      setUser(userData.user);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("transaction_date", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setTransactions(data ?? []);
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
    return <p style={{ padding: 40 }}>Laden...</p>;
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

      <h2>Transacties</h2>

      {transactions.length === 0 && <p>Geen transacties</p>}

      {transactions.map((t) => (
        <div key={t.id} style={{ marginBottom: 10 }}>
          {t.description} - €{t.amount}
          <button
            onClick={() => handleDelete(t.id)}
            style={{ marginLeft: 10 }}
          >
            Verwijder
          </button>
        </div>
      ))}
    </main>
  );
}