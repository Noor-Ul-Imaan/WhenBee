import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DEFAULT_BLOCKS = [
  { name: 'Sleep', icon: '🌙', start_time: '23:00', end_time: '07:00', type: 'sleep', days_of_week: [0,1,2,3,4,5,6] },
  { name: 'University', icon: '🎓', start_time: '09:00', end_time: '17:00', type: 'fixed', days_of_week: [1,2,3,4,5] },
]

function BlockForm({ block, onChange, onRemove }) {
  const toggleDay = (day) => {
    const days = block.days_of_week.includes(day)
      ? block.days_of_week.filter(d => d !== day)
      : [...block.days_of_week, day]
    onChange({ ...block, days_of_week: days })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3">
      <div className="flex gap-2 mb-3">
        <input
          value={block.icon}
          onChange={e => onChange({ ...block, icon: e.target.value })}
          className="w-12 bg-zinc-800 border border-zinc-700 rounded-xl px-2 py-2 text-white text-center text-lg outline-none"
        />
        <input
          value={block.name}
          onChange={e => onChange({ ...block, name: e.target.value })}
          placeholder="Block name"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder-zinc-500 outline-none focus:border-yellow-400 transition-colors"
        />
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="text-zinc-500 text-xs mb-1 block">Start</label>
          <input
            type="time"
            value={block.start_time}
            onChange={e => onChange({ ...block, start_time: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-yellow-400 transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="text-zinc-500 text-xs mb-1 block">End</label>
          <input
            type="time"
            value={block.end_time}
            onChange={e => onChange({ ...block, end_time: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-yellow-400 transition-colors"
          />
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => toggleDay(i)}
            className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
              block.days_of_week.includes(i)
                ? 'bg-yellow-400 text-black'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {['fixed', 'flexible', 'sleep'].map(type => (
          <button
            key={type}
            onClick={() => onChange({ ...block, type })}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
              block.type === type
                ? type === 'fixed'
                  ? 'bg-blue-500 text-white'
                  : type === 'flexible'
                  ? 'bg-orange-400 text-white'
                  : 'bg-zinc-500 text-white'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <button
        onClick={onRemove}
        className="mt-3 text-zinc-600 text-xs hover:text-red-400 transition-colors"
      >
        Remove block
      </button>
    </div>
  )
}

function Onboarding({ setHasSchedule }) {
  const navigate = useNavigate()
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addBlock = () => {
    setBlocks([...blocks, {
      name: '',
      icon: '📌',
      start_time: '09:00',
      end_time: '10:00',
      type: 'flexible',
      days_of_week: [0,1,2,3,4,5,6]
    }])
  }

  const updateBlock = (index, updated) => {
    setBlocks(blocks.map((b, i) => i === index ? updated : b))
  }

  const removeBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const toInsert = blocks
      .filter(b => b.name.trim() !== '')
      .map(b => ({ ...b, user_id: user.id }))

    if (toInsert.length === 0) {
      setError('Add at least one schedule block.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('schedules').insert(toInsert)

    if (error) {
      setError(error.message)
    } else {
      setHasSchedule(true)
      navigate('/home')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black px-6 py-10">
      <div className="max-w-sm mx-auto">

        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🐝</div>
          <h1 className="text-white text-xl font-bold mb-1">Set up your schedule</h1>
          <p className="text-zinc-400 text-sm">Tell Bee when your day is already taken. Be honest — this is how Bee finds the right time for everything else.</p>
        </div>

        <div className="mb-2">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">Your time blocks</p>
          {blocks.map((block, i) => (
            <BlockForm
              key={i}
              block={block}
              onChange={updated => updateBlock(i, updated)}
              onRemove={() => removeBlock(i)}
            />
          ))}
        </div>

        <button
          onClick={addBlock}
          className="w-full border border-dashed border-zinc-700 rounded-2xl py-3 text-zinc-500 text-sm hover:border-yellow-400 hover:text-yellow-400 transition-colors mb-4"
        >
          + Add another block
        </button>

        {error && <p className="text-red-400 text-xs mb-3 px-1">{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-semibold rounded-xl py-3 text-sm transition-colors"
        >
          {loading ? 'Saving...' : "Let's go →"}
        </button>

      </div>
    </div>
  )
}

export default Onboarding