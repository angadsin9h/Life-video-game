import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

export interface ChatMessage {
  id?: number
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSend: (message: string) => Promise<void>
  loading: boolean
}

export default function ChatInterface({ messages, onSend, loading }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const msg = input.trim()
    if (!msg) return
    setInput('')
    await onSend(msg)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <p className="text-4xl mb-2">🤖</p>
            <p>Your AI Coach is ready. Ask anything!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white rounded-br-sm'
                : 'bg-slate-700 text-slate-200 rounded-bl-sm border border-slate-600'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-xl px-4 py-3 border border-slate-600">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-slate-700">
        <input
          type="text"
          className="game-input flex-1"
          placeholder="Ask your AI coach..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="game-btn-primary px-3">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
