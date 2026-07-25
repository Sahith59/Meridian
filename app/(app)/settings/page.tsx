"use client";

// The UI form intentionally only exposes a "name" field - just like a real
// app's settings page would. It PATCHes /api/profile, which (the bug) also
// accepts role/storeCredit from the raw request body. Those fields are not
// reachable through this form at all - only by an attacker crafting the
// request directly, which is exactly the point: see the README's attack
// snippets.

import { useEffect, useState } from "react";
import { BadgeDollarSign, Mail, ShieldCheck, UserRound } from "lucide-react";

type Profile = { id: string; email: string; name: string; role: string; storeCredit: number };

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((body: Profile) => {
        setProfile(body);
        setName(body.name);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (res.ok) {
      setProfile(await res.json());
      setSaved(true);
    }
  }

  if (!profile) return <div className="container"><div className="card">Loading account workspace...</div></div>;

  return (
    <div className="container">
      <div className="page-head command-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
          <p className="page-sub">Profile details for the current Meridian session.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card profile-card">
          <span className="avatar profile-avatar">{profile.name.slice(0, 2).toUpperCase()}</span>
          <h3>{profile.name}</h3>
          <p className="hint">{profile.email}</p>
          <div className="profile-facts">
            <span><Mail size={14} /> {profile.id}</span>
            <span><ShieldCheck size={14} /> {profile.role}</span>
            <span><BadgeDollarSign size={14} /> ${profile.storeCredit.toFixed(2)} credit</span>
          </div>
        </div>

        <div className="card settings-card">
          <div className="card-kicker">Display identity</div>
          <h3>Public profile name</h3>
        <form className="stack" onSubmit={save}>
          <div>
            <label htmlFor="name">Display name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <button type="submit" disabled={busy}>
            <UserRound size={15} /> Save profile
          </button>
          {saved && <p className="hint">Saved.</p>}
        </form>
        </div>
      </div>
    </div>
  );
}
