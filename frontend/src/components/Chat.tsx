import { useState } from 'react';
import { DataTable } from './DataTable';
import { BarChart as BarChartComponent } from './BarChart';
import { LineChart as LineChartComponent } from './LineChart';
import './Chat.css';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  data?: {
    type: 'table' | 'bar_chart' | 'line_chart';
    [key: string]: any;
  };
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage = input;
    const newMessages: Message[] = [
      ...messages,
      { id: Date.now().toString(), content: userMessage, role: 'user' },
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      // Parse the response for data visualization
      let content = data.reply;
      let componentData = null;

      // Try to extract and parse JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          if (parsed.text && parsed.component) {
            content = parsed.text;
            componentData = parsed.component;
          }
        } catch {
          // Failed to parse JSON, use plain text
        }
      } else {
        // Try parsing the whole response as JSON
        try {
          const parsed = JSON.parse(content);
          if (parsed.text && parsed.component) {
            content = parsed.text;
            componentData = parsed.component;
          }
        } catch {
          // Response is plain text, not JSON
        }
      }

      setMessages([
        ...newMessages,
        {
          id: (Date.now() + 1).toString(),
          content,
          role: 'assistant',
          data: componentData,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, there was an error communicating with the server.',
          role: 'assistant',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}
            </div>
            {message.data && (
              <div className="message-component">
                {message.data.type === 'table' && (
                  <DataTable data={message.data} />
                )}
                {message.data.type === 'bar_chart' && (
                  <BarChartComponent data={message.data} />
                )}
                {message.data.type === 'line_chart' && (
                  <LineChartComponent data={message.data} />
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && <div className="message assistant"><div className="message-content">Thinking...</div></div>}
      </div>

      <form onSubmit={handleChatSubmit} className="chat-input-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the roofing database..."
          className="chat-input"
          disabled={isLoading}
        />
        <button type="submit" className="chat-submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
