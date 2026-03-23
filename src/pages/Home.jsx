import { supabase } from '../supabase'

function Home() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🐝</div>
        <h1 className="text-white text-2xl font-bold mb-2">You're in.</h1>
        <p className="text-zinc-400 text-sm mb-8">Home screen coming soon.</p>
        <button
          onClick={handleLogout}
          className="text-zinc-500 text-sm hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  )
}

export default Home