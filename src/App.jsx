import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <span className="text-white text-2xl">🐝</span>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/home" />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/home" />} />
        <Route path="/home" element={session ? <Home /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={session ? "/home" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App