import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

async function registerPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    })

    const { data: { user } } = await supabase.auth.getUser()

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, userId: user.id })
    })

    const data = await res.json()
    console.log('subscribe response:', data)
    return res.ok
  } catch (e) {
    console.error('Push registration failed:', e)
    return false
  }
}

function Home() {
  const navigate = useNavigate()
  const [notifStatus, setNotifStatus] = useState('unknown')

  useEffect(() => {
    if ('Notification' in window) {
      setNotifStatus(Notification.permission)
    }
  }, [])

  const handleEnableNotifications = async () => {
    const success = await registerPushNotifications()
    if (success) {
      setNotifStatus('granted')
    } else {
      setNotifStatus('denied')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🐝</div>
          <h1 className="text-white text-2xl font-bold mb-1">Hey there.</h1>
          <p className="text-zinc-400 text-sm">What do you want to fit into your life?</p>
        </div>

        <button
          onClick={() => navigate('/chat')}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold rounded-xl py-4 text-sm transition-colors mb-3"
        >
          + Add something new
        </button>

        {notifStatus !== 'granted' && (
          <button
            onClick={handleEnableNotifications}
            className="w-full bg-zinc-900 border border-zinc-700 hover:border-yellow-400 text-zinc-300 hover:text-yellow-400 rounded-xl py-3 text-sm transition-colors mb-3"
          >
            🔔 Enable reminders
          </button>
        )}

        {notifStatus === 'granted' && (
          <p className="text-center text-zinc-600 text-xs mb-3">🔔 Reminders are on</p>
        )}

        <button
          onClick={handleLogout}
          className="w-full text-zinc-600 text-sm hover:text-white transition-colors py-2"
        >
          Log out
        </button>

      </div>
    </div>
  )
}

export default Home