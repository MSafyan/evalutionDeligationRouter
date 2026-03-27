import { useState, useRef, useEffect } from 'react'
import './App.css'
import ChartRenderer from './ChartRenderer'

function App() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (queryText) => {
    if (!queryText.trim() || isLoading) return

    const userMessage = { role: 'user', content: queryText }
    setMessages((prev) => [...prev, userMessage])
    setQuery('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: queryText }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let answer = ''
      let data = []
      let buffer = ''

      const assistantMessage = {
        role: 'assistant',
        content: '',
        data: [],
        isStreaming: true,
      }

      setMessages((prev) => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'answer_chunk') {
                answer += event.chunk
                setMessages((prev) => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: answer,
                  }
                  return newMessages
                })
              } else if (event.type === 'data') {
                data = event.data
                setMessages((prev) => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    data: data,
                  }
                  return newMessages
                })
              } else if (event.type === 'done') {
                setMessages((prev) => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    isStreaming: false,
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: `Error: ${error.message}`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const exampleQueries = [
    'What is photosynthesis?',
    'Show me a bar chart of sales',
    'What were Q1 sales and show me a chart',
    'What is 2+2?',
  ]

  return (
    <div className="app">
      <header className="header">
        <h1>Multi-Agent RAG System</h1>
        <p>Test the backend with streaming responses</p>
      </header>

      <div className="main-container">
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome">
              <h2>Welcome! 👋</h2>
              <p>Try asking a question or click one of the examples below:</p>
              <div className="example-queries">
                {exampleQueries.map((q, i) => (
                  <button
                    key={i}
                    className="example-btn"
                    onClick={() => handleSubmit(q)}
                    disabled={isLoading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              {message.role === 'user' && (
                <div className="message-content">
                  <strong>You:</strong>
                  <p>{message.content}</p>
                </div>
              )}

              {message.role === 'assistant' && (
                <div className="message-content">
                  <strong>Assistant:</strong>
                  <div className="answer">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                    {message.isStreaming && <span className="cursor">▊</span>}
                  </div>

                  {message.data && message.data.length > 0 && (
                    <div className="data-section">
                      <h4>References & Data:</h4>
                      {message.data.map((item, i) => (
                        <div key={i} className="data-item">
                          {item.type === 'rag_reference' && (
                            <div className="rag-reference">
                              <strong>📄 File {item.fileId}</strong>
                              <span> - Pages: {item.pageNumbers.join(', ')}</span>
                            </div>
                          )}

                          {item.type === 'chartjs_config' && (
                            <ChartRenderer chartData={item} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {message.role === 'error' && (
                <div className="message-content error-content">
                  <strong>Error:</strong>
                  <p>{message.content}</p>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(query)
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="query-input"
            />
            <button type="submit" disabled={isLoading || !query.trim()} className="send-btn">
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
