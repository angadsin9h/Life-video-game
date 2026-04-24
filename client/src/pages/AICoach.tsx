import { useEffect, useState } from 'react'
import axios from 'axios'
import ChatInterface, { ChatMessage } from '../components/ChatInterface'
import { Trash2 } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  'Analyze my productivity this week',
  'How can I improve my health score?',
  'Give me a workout routine',
  'Help me set better goals',
  'What habits should I build?',
  'How do I get into deep work mode?',
]

export default function AICoach() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    axios.get<ChatMessage[]>('/api/ai/history')
      .then(r => setMessages(r.data))
      .catch(console.error)
  }, [])

  const sendMessage = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await axios.post<{ reply: string }>('/api/ai/chat', { message: text })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Failed to get response. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    await axios.post('/api/ai/clear')
    setMessages([])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>AI Coach</h1>
          <p className="text-slate-400 mt-1">Your personal life optimization advisor</p>
        </div>
        <button onClick={clearHistory} className="game-btn-secondary flex items-center gap-2 text-sm">
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>

      {/* Suggested prompts */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map(p => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat box */}
      <div className="game-card" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
        <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-slate-400">LifeQuest AI Coach Online</span>
        </div>
        <div className="flex-1 min-h-0">
          <ChatInterface messages={messages} onSend={sendMessage} loading={loading} />
        </div>
      </div>
    </div>
  )
}
