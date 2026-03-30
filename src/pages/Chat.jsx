import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function Chat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hey! What do you want to fit into your life? Tell me anything — a habit, a goal, something you've been putting off." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState([])
  const bottomRef = useRef(null)

  // Load user's schedule from Supabase
  useEffect(() => {
    const loadSchedule = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('user id:', user?.id)
    const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
    if (data) setSchedule(data)
    }
    loadSchedule()
  }, [])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const scheduleText = schedule.map(b =>
        `- ${b.icon} ${b.name}: ${b.start_time} to ${b.end_time} [${b.type}] on days ${b.days_of_week.join(',')}`
      ).join('\n')

      const systemPrompt = `You are Bee, a warm and slightly witty scheduling assistant inside the WhenBee app. Your job is to help users fit goals and habits into their real life schedule.

The user's current schedule:
${scheduleText || 'No schedule set yet.'}

Days are numbered 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.
Fixed blocks cannot be moved. Flexible blocks can be adjusted. Sleep is sacred.

Your job in this conversation:
1. Understand what the user wants to do
2. Ask smart follow-up questions — deadline, effort level, constraints. Ask ONE question at a time. Maximum 3 questions total before generating a plan.
3. When you have enough info, generate a plan in this EXACT format:

PLAN:
- What: [activity name]
- Method: [specific approach and why]
- When: [exact time slot from their schedule]
- Duration: [e.g. 25 minutes]
- Frequency: [e.g. 5 days a week]
- Why this time: [1 sentence explanation based on their schedule]
- Completion: [estimated completion date or milestone]

Keep responses short. Be warm but not over the top. Never preachy. Talk like a smart friend. Always strictly follow the PLAN format. Never skip fields. Be precise with time suggestions based on the schedule.`

const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          //'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          //'anthropic-version': '2023-06-01'
          //'anthropic-dangerous-allow-frombrowser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          system: systemPrompt,
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      const assistantMessage = {
        role: 'assistant',
        content: data?.choices?.[0]?.message?.content || "No response."
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Something went wrong on my end. Try again?"
      }])
    }

    setLoading(false)
  }

const handleAccept = async (planContent) => {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: task } = await supabase.from('tasks').insert({
    user_id: user.id,
    title: planContent,
    conversation_history: messages,
    plan_details: { raw: planContent },
    status: 'active'
  }).select().single()

  const lines = planContent.split('\n')
  const whenLine = lines.find(l => l.toLowerCase().includes('when:'))
  const timeMatch = whenLine?.match(/(\d{1,2}):(\d{2})/)

  // Show debug info
  alert(`task: ${task?.id ? 'saved' : 'FAILED'}\nwhenLine: ${whenLine}\ntimeMatch: ${timeMatch?.[0]}`)

  if (task && whenLine && timeMatch) {
    const now = new Date()
    const hours = parseInt(timeMatch[1])
    const minutes = parseInt(timeMatch[2])

    const isAM = whenLine.toLowerCase().includes('am')
    const isPM = whenLine.toLowerCase().includes('pm')
    let adjustedHours = hours
    if (isPM && hours < 12) adjustedHours = hours + 12
    if (isAM && hours === 12) adjustedHours = 0

    const scheduledFor = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      adjustedHours,
      minutes
    )

    if (scheduledFor <= now) {
      scheduledFor.setDate(scheduledFor.getDate() + 1)
    }

    const { error } = await supabase.from('notifications').insert({
      user_id: user.id,
      task_id: task.id,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending'
    })

    alert(`notification insert error: ${error ? error.message : 'none'}`)
  } else {
    alert(`skipped - task:${!!task} whenLine:${!!whenLine} timeMatch:${!!timeMatch}`)
  }

  navigate('/home')
}

  const handleModify = () => {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "Sure, what would you like to change?"
    }])
  }
  return (
    <div className="min-h-screen bg-black flex flex-col max-w-sm mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-900">
        <button
          onClick={() => navigate('/home')}
          className="text-zinc-500 hover:text-white transition-colors text-sm"
        >
          ←
        </button>
        <span className="text-xl">🐝</span>
        <span className="text-white font-semibold text-sm">Bee</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
{messages.map((msg, i) => {
  const isPlan = msg.role === 'assistant' && msg.content.includes('PLAN:')

  if (isPlan) {
    const lines = msg.content
      .split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(l => l.replace(/^-\s*/, '').trim())

    return (
      <div key={i} className="flex justify-start">
        <div className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🐝</span>
            <span className="text-yellow-400 text-sm font-semibold">Here's your plan</span>
          </div>

          <div className="space-y-2 mb-4">
            {lines.map((line, j) => {
              const [label, ...rest] = line.split(':')
              const value = rest.join(':').trim()
              return (
                <div key={j} className="flex gap-2">
                  <span className="text-zinc-500 text-xs w-24 flex-shrink-0 pt-0.5">{label}</span>
                  <span className="text-white text-xs leading-relaxed">{value}</span>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(msg.content)}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => handleModify()}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl py-2.5 text-sm transition-colors"
            >
              Modify
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        msg.role === 'user'
          ? 'bg-yellow-400 text-black rounded-br-sm'
          : 'bg-zinc-900 text-white rounded-bl-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  )
})}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-zinc-900">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Tell Bee what you want to do..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 outline-none focus:border-yellow-400 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black font-bold rounded-xl px-4 transition-colors"
          >
            →
          </button>
        </div>
      </div>

    </div>
  )
}

export default Chat