import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

async function call(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.status === 204 ? null : res.json();
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error("Wrong username or password");
      const data = await res.json();
      sessionStorage.setItem("token", data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form onSubmit={submit} className="w-80 space-y-4">
        <h1 className="text-3xl font-bold">LedgerLite</h1>
        <p className="text-slate-400 text-sm">Your clients. Your invoices. One dashboard.</p>
        <input className="w-full p-3 rounded bg-slate-800" placeholder="Username"
          value={username} onChange={e => setUsername(e.target.value)} required />
        <input type="password" className="w-full p-3 rounded bg-slate-800" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="w-full p-3 rounded bg-emerald-500 font-semibold">Sign in</button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ clients: 0, unpaid_count: 0, unpaid_total: "0" });
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [c, i, s] = await Promise.all([
        call("/clients/", token),
        call("/invoices/", token),
        call("/summary/", token),
      ]);
      setClients(Array.isArray(c) ? c : c.results);
      setInvoices(Array.isArray(i) ? i : i.results);
      setSummary(s);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { if (token) load(); }, [token]);

  async function addClient(e) {
    e.preventDefault();
    await call("/clients/", token, { method: "POST", body: JSON.stringify({ name }) });
    setName(""); load();
  }

  async function addInvoice(e) {
    e.preventDefault();
    await call("/invoices/", token, {
      method: "POST",
      body: JSON.stringify({ client: Number(clientId), amount: Number(amount) }),
    });
    setAmount(""); load();
  }

  async function toggle(id, status) {
    await call(`/invoices/${id}/`, token, {
      method: "PATCH",
      body: JSON.stringify({ status: status === "paid" ? "unpaid" : "paid" }),
    });
    load();
  }

  function logout() {
    sessionStorage.removeItem("token");
    setToken(null);
  }

  if (!token) return <Login onLogin={setToken} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">LedgerLite <span className="text-emerald-400">/ Dashboard</span></h1>
        <button onClick={logout} className="text-sm text-slate-400">Log out</button>
      </header>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          ["Active clients", summary.clients],
          ["Unpaid invoices", summary.unpaid_count],
          ["Amount outstanding (₱)", Number(summary.unpaid_total).toLocaleString()],
        ].map(([label, value]) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-3">Add client</h2>
          <form onSubmit={addClient} className="flex gap-2 mb-4">
            <input className="bg-slate-900 p-2 rounded flex-1" placeholder="Client name"
              value={name} onChange={e => setName(e.target.value)} required />
            <button className="bg-emerald-500 text-slate-950 px-4 rounded font-semibold">Add</button>
          </form>
          <ul className="space-y-2">
            {clients.map(c => (
              <li key={c.id} className="bg-slate-900 p-3 rounded-lg">{c.name}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Create invoice</h2>
          <form onSubmit={addInvoice} className="flex gap-2 mb-4">
            <select className="bg-slate-900 p-2 rounded" value={clientId}
              onChange={e => setClientId(e.target.value)} required>
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="bg-slate-900 p-2 rounded w-28" type="number" step="0.01" min="0.01"
              placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required />
            <button className="bg-emerald-500 text-slate-950 px-4 rounded font-semibold">Save</button>
          </form>
          <ul className="space-y-2">
            {invoices.map(inv => (
              <li key={inv.id} className="bg-slate-900 p-3 rounded-lg flex justify-between items-center">
                <span>{inv.client_name} · ₱{Number(inv.amount).toLocaleString()}</span>
                <button onClick={() => toggle(inv.id, inv.status)}
                  className={`text-xs px-3 py-1 rounded-full ${inv.status === "paid" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {inv.status} → toggle
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}