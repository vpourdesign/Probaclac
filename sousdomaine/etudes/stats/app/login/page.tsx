'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Mot de passe incorrect')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
      <form
        onSubmit={submit}
        className="bg-white rounded-xl2 shadow-card p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-xl font-semibold text-textMain text-center">
          Probaclac — Accès réservé
        </h1>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="Mot de passe"
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {error && <p className="text-danger text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition"
        >
          Connexion
        </button>
      </form>
    </div>
  )
}
