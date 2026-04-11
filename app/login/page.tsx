"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔐 Check login
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
        fetchTransactions(data.user.id);
      }
    });
  }, []);

  // 📥 Haal transacties op
  async function fetchTransactions(userId: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }

    setLoading(false);
  }

  // ❌ Delete
  async function handleDelete(id: string) {
    await supabase.from("transactions").delete().eq("id", id);

    // refresh
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) return <p style={{ padding: 40 }}>Laden...</p>;

  return (
    <main style={{ padding: 40 }}>
      <h1>Financieel overzicht</h1>

      <p>Ingelogd als: {user?.email}</p>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push("/login");
        }}
      >
        Uitloggen
      </button>

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