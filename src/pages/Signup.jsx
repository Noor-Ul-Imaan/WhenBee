import { useState } from 'react'
import { supabase } from '../supabase'
import { Link } from 'react-router-dom'

function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🐝</div>
        <h2 className="text-white text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-zinc-400 text-sm">We sent you a confirmation link. Click it and you're in.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐝</div>
          <h1 className="text-white text-2xl font-bold">WhenBee</h1>
          <p className="text-zinc-400 text-sm mt-1">Figure out when. Get it done.</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 outline-none focus:border-yellow-400 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 outline-none focus:border-yellow-400 transition-colors"
          />

          {error && <p className="text-red-400 text-xs px-1">{error}</p>}

          <button
            onClick={handleSignup}
            disabled={loading || !email || !password}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {loading ? '...' : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-yellow-400 hover:underline">Log in</Link>
        </p>

      </div>
    </div>
  )
}

export default Signup