"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Wachtwoord succesvol gewijzigd");
    router.push("/");
  }

  return (
    <main style={{ padding: 40, maxWidth: 400 }}>
      <h1>Nieuw wachtwoord instellen</h1>

      <form onSubmit={handleUpdatePassword}>
        <input
          type="password"
          placeholder="Nieuw wachtwoord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? "Bezig..." : "Wachtwoord opslaan"}
        </button>
      </form>
    </main>
  );
}