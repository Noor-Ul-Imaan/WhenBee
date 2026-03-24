import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasSchedule, setHasSchedule] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session) {
        const { data } = await supabase
          .from('schedules')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1)
        setHasSchedule(data && data.length > 0)
      }
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setHasSchedule(false)
      }
      if (event === 'SIGNED_IN') {
        setLoading(true)
        setSession(session)
        const { data } = await supabase
          .from('schedules')
          .select('id')
          .eq('user_id', session.user.id)
          .limit(1)
        setHasSchedule(data && data.length > 0)
        setLoading(false)
      }
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
        <Route path="/login" element={!session ? <Login /> : <Navigate to={hasSchedule ? "/home" : "/onboarding"} />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to={hasSchedule ? "/home" : "/onboarding"} />} />
        <Route path="/onboarding" element={session ? <Onboarding setHasSchedule={setHasSchedule} /> : <Navigate to="/login" />} />
        <Route path="/home" element={session ? <Home /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={!session ? "/login" : hasSchedule ? "/home" : "/onboarding"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App