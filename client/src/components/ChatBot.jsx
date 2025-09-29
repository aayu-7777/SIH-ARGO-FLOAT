import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your Argo Float data assistant. I can help you query and analyze oceanographic float data. Try asking me things like "Show me all available floats" or "What\'s the latest location of float 1900816?"',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [sampleQueries, setSampleQueries] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Load sample queries with error handling
    const loadSampleQueries = async () => {
      try {
        const response = await fetch('http://localhost:5002/api/sample-queries');
        if (!response.ok) throw new Error('Failed to load sample queries');
        const data = await response.json();
        setSampleQueries(data.sampleQueries || []);
      } catch (error) {
        console.error('Error loading sample queries:', error);
        // Fallback sample queries
        setSampleQueries([
          "Show me all available floats",
          "What's the latest temperature data from 2025?",
          "Find floats in the Pacific Ocean",
          "Show salinity profiles for float 1901740",
          "What's the average depth of measurements in 2025?",
          "Find floats with the highest temperature readings"
        ]);
      }
    };
    
    loadSampleQueries();
  }, []);

  const sendMessage = useCallback(async (messageOverride) => {
    const messageToSend = (messageOverride ?? inputMessage).trim();
    if (!messageToSend || isLoading) return;

    setError(null);
    setIsTyping(true);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageOverride) setInputMessage('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('http://localhost:5002/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory: conversationHistory
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sqlQuery: data.sqlQuery,
        resultsCount: data.resultsCount,
        data: data.data
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory(data.conversationHistory || conversationHistory);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: error.name === 'AbortError' 
          ? 'Request timed out. Please try again with a simpler query.'
          : 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(error.message);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [inputMessage, isLoading, conversationHistory]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const useSampleQuery = useCallback((query) => {
    sendMessage(query);
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: 'Hello! I\'m your Argo Float data assistant. I can help you query and analyze oceanographic float data. Try asking me things like "Show me all available floats" or "What\'s the latest location of float 1900816?"',
        timestamp: new Date()
      }
    ]);
    setConversationHistory([]);
    setError(null);
  }, []);

  const formatTimestamp = useCallback((timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const memoizedSampleQueries = useMemo(() => {
    return sampleQueries.slice(0, 6);
  }, [sampleQueries]);

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <div className="header-info">
            <h2>🤖 Argo Float Data Assistant</h2>
            <div className="status-indicator">
              <div className={`status-dot ${isLoading ? 'loading' : 'online'}`}></div>
              <span>{isLoading ? 'Processing...' : 'Online'}</span>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={clearChat} className="clear-button" disabled={isLoading}>
              <span>🗑️</span>
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type} ${message.isError ? 'error' : ''}`}>
            <div className="message-avatar">
              {message.type === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">
                {message.content}
              </div>
              {message.sqlQuery && (
                <details className="sql-details">
                  <summary>
                    <span>🔍</span>
                    View SQL Query
                    {message.resultsCount !== undefined && (
                      <span className="results-badge">{message.resultsCount} rows</span>
                    )}
                  </summary>
                  <pre className="sql-query">{message.sqlQuery}</pre>
                </details>
              )}
              {message.data && message.data.length > 0 && (
                <details className="data-details">
                  <summary>
                    <span>📊</span>
                    View Data
                    <span className="data-badge">{message.data.length} rows</span>
                  </summary>
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          {Object.keys(message.data[0]).map(key => (
                            <th key={key}>{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {message.data.slice(0, 10).map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value, i) => (
                              <td key={i}>
                                {value === null ? 'null' : 
                                 typeof value === 'object' ? JSON.stringify(value) : 
                                 String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {message.data.length > 10 && (
                      <div className="data-truncated">
                        Showing first 10 of {message.data.length} rows
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
            <div className="message-timestamp">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message assistant typing">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sample-queries">
        <h4>💡 Try these sample queries:</h4>
        <div className="sample-query-buttons">
          {memoizedSampleQueries.map((query, index) => (
            <button
              key={index}
              className="sample-query-button"
              onClick={() => useSampleQuery(query)}
              disabled={isLoading}
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      <div className="chatbot-input">
        <div className="input-container">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about Argo float data... (e.g., 'Show me all floats' or 'What's the temperature range for float 1900816?')"
            disabled={isLoading}
            rows={2}
            className="message-input"
          />
          <button 
            onClick={sendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : (
              <>
                <span>📤</span>
                Send
              </>
            )}
          </button>
        </div>
        <div className="input-footer">
          <span className="input-hint">Press Enter to send, Shift+Enter for new line</span>
          <span className="character-count">{inputMessage.length}/500</span>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

