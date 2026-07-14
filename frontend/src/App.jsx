import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  FileUp, 
  FileCheck, 
  FileX, 
  Send, 
  User, 
  Bot, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

const BACKEND_URL = 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [totalChunks, setTotalChunks] = useState(null);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', success: true });

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat log when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Show a toast message
  const showToast = (message, success = true) => {
    setToast({ show: true, message, success });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileUpload(droppedFile);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Upload and vectorize PDF
  const handleFileUpload = async (uploadFile) => {
    if (uploadFile.type !== 'application/pdf') {
      showToast('Please select a valid PDF document.', false);
      return;
    }

    setFile(uploadFile);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      setDocumentLoaded(true);
      setFileName(data.filename);
      setTotalChunks(data.total_chunks);
      
      // Clear previous messages and output a welcome bot message
      setMessages([
        {
          text: `I have successfully loaded and vectorized **${data.filename}** (${data.total_chunks} chunks). What would you like to know about it?`,
          sender: 'bot'
        }
      ]);
      showToast('Document vectorized successfully!');
    } catch (error) {
      console.error('Upload Error:', error);
      showToast('Error vectorizing PDF. Make sure backend is running.', false);
    } finally {
      setIsUploading(false);
    }
  };

  // Send query to the chatbot
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    const queryText = inputText.trim();
    if (!queryText || !documentLoaded) return;

    setInputText('');
    setMessages(prev => [...prev, { text: queryText, sender: 'user' }]);
    setIsThinking(true);

    try {
      const response = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: queryText })
      });

      if (!response.ok) {
        throw new Error(`Query failed with status: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { text: data.answer, sender: 'bot' }]);
    } catch (error) {
      console.error('Ask Error:', error);
      setMessages(prev => [
        ...prev, 
        { 
          text: 'Sorry, I encountered an error answering your question. Please verify the backend connection.', 
          sender: 'bot' 
        }
      ]);
      showToast('Failed to reach backend API.', false);
    } finally {
      setIsThinking(false);
    }
  };

  // Interactive Prompt Suggestions
  const useSamplePrompt = (promptText) => {
    if (!documentLoaded) {
      showToast('Please upload a PDF document first.', false);
      return;
    }
    setInputText(promptText);
  };

  // Helper to render markdown-like text to HTML nodes (bold, code blocks, bullet points)
  const formatMessageText = (text) => {
    // Escape standard HTML tags
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks: ```code```
    const parts = [];
    const codeBlockRegex = /```([\s\S]+?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(formatted)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: formatted.substring(lastIndex, match.index)
        });
      }
      parts.push({
        type: 'code-block',
        content: match[1]
      });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < formatted.length) {
      parts.push({
        type: 'text',
        content: formatted.substring(lastIndex)
      });
    }

    if (parts.length === 0) {
      parts.push({ type: 'text', content: formatted });
    }

    return parts.map((part, index) => {
      if (part.type === 'code-block') {
        return (
          <pre key={index}>
            <code>{part.content.trim()}</code>
          </pre>
        );
      }

      // Format bold, inline code, and bullet points inside regular text block
      const contentLines = part.content.split('\n').map((line, lIdx) => {
        let processedLine = line;

        // Bullet point format starting with "*" or "-"
        const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
        if (isBullet) {
          processedLine = line.trim().substring(2);
        }

        // Inline code formatting `code`
        const inlineCodeRegex = /`([^`]+)`/g;
        const lineParts = [];
        let inlineIdx = 0;
        let inlineMatch;
        
        while ((inlineMatch = inlineCodeRegex.exec(processedLine)) !== null) {
          if (inlineMatch.index > inlineIdx) {
            lineParts.push({ type: 'text', content: processedLine.substring(inlineIdx, inlineMatch.index) });
          }
          lineParts.push({ type: 'inline-code', content: inlineMatch[1] });
          inlineIdx = inlineCodeRegex.lastIndex;
        }
        if (inlineIdx < processedLine.length) {
          lineParts.push({ type: 'text', content: processedLine.substring(inlineIdx) });
        }
        if (lineParts.length === 0) {
          lineParts.push({ type: 'text', content: processedLine });
        }

        // Render inline elements (with bold mapping)
        const renderedLine = lineParts.map((lPart, lpIdx) => {
          if (lPart.type === 'inline-code') {
            return <code key={lpIdx}>{lPart.content}</code>;
          }

          // Bold pattern: **bold**
          const boldRegex = /\*\*([^*]+)\*\*/g;
          const boldParts = [];
          let boldIdx = 0;
          let boldMatch;

          while ((boldMatch = boldRegex.exec(lPart.content)) !== null) {
            if (boldMatch.index > boldIdx) {
              boldParts.push({ type: 'text', content: lPart.content.substring(boldIdx, boldMatch.index) });
            }
            boldParts.push({ type: 'bold', content: boldMatch[1] });
            boldIdx = boldRegex.lastIndex;
          }
          if (boldIdx < lPart.content.length) {
            boldParts.push({ type: 'text', content: lPart.content.substring(boldIdx) });
          }
          if (boldParts.length === 0) {
            boldParts.push({ type: 'text', content: lPart.content });
          }

          return boldParts.map((bPart, bpIdx) => {
            if (bPart.type === 'bold') {
              return <strong key={bpIdx}>{bPart.content}</strong>;
            }
            return bPart.content;
          });
        });

        if (isBullet) {
          return (
            <li key={lIdx} style={{ marginLeft: '20px', marginBottom: '4px' }}>
              {renderedLine}
            </li>
          );
        }

        return <p key={lIdx} style={{ marginBottom: lIdx === part.content.split('\n').length - 1 ? 0 : '8px' }}>{renderedLine}</p>;
      });

      return <React.Fragment key={index}>{contentLines}</React.Fragment>;
    });
  };

  return (
    <>
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>

      <div className="app-container">
        {/* Toast Alert Notification */}
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.success ? 'toast-success' : 'toast-error'}`}>
          {toast.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>

        <header>
          <div className="logo-section">
            <div className="logo-icon">
              <Brain size={24} />
            </div>
            <div className="logo-text">
              <h1>Aether RAG</h1>
              <p>AI Document Assistant</p>
            </div>
          </div>
          <div className="status-badge">
            <div className={`status-dot ${documentLoaded ? 'active' : ''}`}></div>
            <span>{documentLoaded ? 'Document Loaded' : 'No Document Loaded'}</span>
          </div>
        </header>

        <div className="workspace">
          {/* Sidebar Panel */}
          <aside className="sidebar">
            {/* Upload Area */}
            <div>
              <div className="section-title">
                <FileUp size={16} /> Document Source
              </div>
              <div 
                className={`upload-zone ${dragActive ? 'dragover' : ''}`}
                onClick={triggerFileInput}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <FileUp size={32} className="upload-icon" />
                <p><span>Click to upload</span> or drag and drop<br />your PDF file here</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Document Info Card */}
            {documentLoaded && (
              <div className="doc-card">
                <div className="doc-header">
                  <FileCheck size={20} className="doc-icon" />
                  <span className="doc-name" title={fileName}>{fileName}</span>
                </div>
                <div className="doc-stats">
                  <div className="doc-stat">
                    <span className="doc-stat-label">Status</span>
                    <span className="doc-stat-val" style={{ color: 'var(--accent-green)' }}>Indexed</span>
                  </div>
                  <div className="doc-stat">
                    <span className="doc-stat-label">Total Chunks</span>
                    <span className="doc-stat-val">{totalChunks}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions Prompts */}
            <div>
              <div className="section-title">
                <Lightbulb size={16} /> Suggested Prompts
              </div>
              <div className="samples-container">
                <button 
                  className="sample-tag" 
                  onClick={() => useSamplePrompt('Summarize the key points of the document.')}
                >
                  Summarize the key points of the document.
                </button>
                <button 
                  className="sample-tag" 
                  onClick={() => useSamplePrompt('What are the primary conclusions or findings?')}
                >
                  What are the primary conclusions or findings?
                </button>
                <button 
                  className="sample-tag" 
                  onClick={() => useSamplePrompt('Explain any complex terms or methodologies used.')}
                >
                  Explain any complex terms or methodologies used.
                </button>
              </div>
            </div>
          </aside>

          {/* Chat Panel */}
          <main className="chat-container">
            {/* Indexing Progress Screen */}
            {isUploading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <div>Analyzing & Vectorizing PDF...</div>
              </div>
            )}

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <Brain />
                  <h3>Aether Document Assistant</h3>
                  <p>Upload a PDF document on the left sidebar to start chat indexing. Once analyzed, you can query and chat about any details within the file.</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender}`}>
                    <div className="avatar">
                      {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="bubble">
                      {formatMessageText(msg.text)}
                    </div>
                  </div>
                ))
              )}

              {/* Bot thinking bubble */}
              {isThinking && (
                <div className="message bot">
                  <div className="avatar">
                    <Bot size={16} />
                  </div>
                  <div className="bubble">
                    <div className="typing-indicator">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form className="input-bar" onSubmit={sendMessage}>
              <div className="input-wrapper">
                <textarea 
                  className="chat-input" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask a question about the document..." 
                  disabled={!documentLoaded}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                ></textarea>
                <button 
                  type="submit" 
                  className="send-btn" 
                  disabled={!documentLoaded || !inputText.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
