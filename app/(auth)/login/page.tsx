'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-[#f0e6d0] mb-2">¡Casi listo!</h2>
          <p className="text-sm text-[#6b7280]">
            Te hemos enviado un enlace de confirmación a <strong className="text-[#f0e6d0]">{email}</strong>. 
            Revisa tu bandeja de entrada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏯</div>
          <h1 className="text-2xl font-bold text-[#f59e0b]">
            {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#2d2d44] rounded-xl text-[#f0e6d0] placeholder:text-[#6b7280] focus:outline-none focus:border-[#f59e0b]"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#2d2d44] rounded-xl text-[#f0e6d0] placeholder:text-[#6b7280] focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          {error && (
            <div className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f59e0b] text-black font-bold py-3 rounded-xl hover:bg-[#d97706] transition-colors disabled:opacity-50"
          >
            {loading ? '...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-[#a78bfa] hover:text-[#f59e0b] transition-colors"
          >
            {isSignUp
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  )
}
