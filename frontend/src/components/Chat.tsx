import { useChat } from 'ai/react';
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
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: 'http://localhost:5000/api/chat',
  });

  const [parsedMessages, setParsedMessages] = useState<Message[]>([]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userMessage = input;
    setParsedMessages([
      ...parsedMessages,
      { id: Date.now().toString(), content: userMessage, role: 'user' },
    ]);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...parsedMessages.map(m => ({ role: m.role, content: m.content })),
                     { role: 'user', content: userMessage }],
        }),
      });

      const data = await response.json();

      // Parse the response for data visualization
      let content = data.reply;
      let componentData = null;

      try {
        const parsed = JSON.parse(data.reply);
        if (parsed.text && parsed.component) {
          content = parsed.text;
          componentData = parsed.component;
        }
      } catch {
        // Response is plain text, not JSON
      }

      setParsedMessages([
        ...parsedMessages,
        { id: Date.now().toString(), content: userMessage, role: 'user' },
        {
          id: (Date.now() + 1).toString(),
          content,
          role: 'assistant',
          data: componentData,
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
    }

    handleInputChange({ target: { value: '' } } as any);
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {parsedMessages.map((message) => (
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
      </div>

      <form onSubmit={handleChatSubmit} className="chat-input-form">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about the roofing database..."
          className="chat-input"
        />
        <button type="submit" className="chat-submit">Send</button>
      </form>
    </div>
  );
}
