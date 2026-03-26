import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

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