import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  // Load history from localStorage on component mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('whats_direct_history')
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (e) {
      console.error('Error loading history:', e)
    }
  }, [])

  // Helper: show toast notification
  const showToastMessage = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 3000)
  }

  // Sanitizer: strip everything except digits
  const getCleanDigits = (input) => {
    return input.replace(/\D/g, '')
  }

  // Prepend country code logic (default: India +91)
  const getProcessedPhone = (input) => {
    const clean = getCleanDigits(input)
    if (!clean) return ''
    
    // If it's a standard 10-digit Indian number, auto-prepend 91
    if (clean.length === 10) {
      return `91${clean}`
    }
    
    // If it starts with 0 and has 11 digits (e.g. 09876543210), strip 0 and prepend 91
    if (clean.length === 11 && clean.startsWith('0')) {
      return `91${clean.slice(1)}`
    }
    
    // Otherwise, assume they entered a number with country code already
    return clean
  }

  const cleanInput = getCleanDigits(phone)
  const finalPhone = getProcessedPhone(phone)
  
  // Validation: final output (with code) must be between 7 and 15 digits
  const isValidPhone = finalPhone.length >= 7 && finalPhone.length <= 15
  
  // Format for display preview (e.g. +91 98765 43210)
  const formatDisplayPhone = (digits) => {
    if (!digits) return ''
    if (digits.startsWith('91') && digits.length === 12) {
      return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
    }
    return `+${digits}`
  }

  const displayTarget = formatDisplayPhone(finalPhone)
  const hasAutoPrepended = cleanInput.length === 10 || (cleanInput.length === 11 && cleanInput.startsWith('0'))

  // Generate the wa.me link
  const generateLink = () => {
    if (!isValidPhone) return ''
    const base = `https://wa.me/${finalPhone}`
    if (message.trim()) {
      return `${base}?text=${encodeURIComponent(message.trim())}`
    }
    return base
  }

  const generatedUrl = generateLink()

  // Save to history helper
  const saveToHistory = (formattedNum, originalMsg) => {
    if (!formattedNum) return

    const newHistoryItem = {
      id: Date.now(),
      phone: formattedNum,
      message: originalMsg.trim(),
      timestamp: new Date().toLocaleDateString()
    }

    // Avoid duplicate entry if the exact same number and message exist
    const isDuplicate = history.some(
      item => item.phone === formattedNum && item.message === originalMsg.trim()
    )

    if (isDuplicate) {
      // Move duplicate to top by removing it first, then prepending
      const filtered = history.filter(
        item => !(item.phone === formattedNum && item.message === originalMsg.trim())
      )
      const updated = [newHistoryItem, ...filtered].slice(0, 5)
      setHistory(updated)
      localStorage.setItem('whats_direct_history', JSON.stringify(updated))
      return
    }

    const updated = [newHistoryItem, ...history].slice(0, 5)
    setHistory(updated)
    localStorage.setItem('whats_direct_history', JSON.stringify(updated))
  }

  // Trigger redirection
  const handleChat = (e) => {
    if (e) e.preventDefault()
    if (!isValidPhone) {
      showToastMessage('Please enter a valid mobile number.', 'error')
      return
    }

    saveToHistory(finalPhone, message)
    window.open(generatedUrl, '_blank', 'noopener,noreferrer')
    showToastMessage('Redirecting to WhatsApp...')
  }

  // Copy link to clipboard
  const handleCopyLink = () => {
    if (!isValidPhone) {
      showToastMessage('Please enter a valid mobile number to generate link.', 'error')
      return
    }

    navigator.clipboard.writeText(generatedUrl)
      .then(() => {
        saveToHistory(finalPhone, message)
        showToastMessage('Link copied to clipboard!')
      })
      .catch(() => {
        showToastMessage('Failed to copy link.', 'error')
      })
  }

  // Clear form inputs
  const handleClear = () => {
    setPhone('')
    setMessage('')
    showToastMessage('Form cleared')
  }

  // Trigger chat from history item
  const handleHistoryChat = (item) => {
    const base = `https://wa.me/${item.phone}`
    const url = item.message ? `${base}?text=${encodeURIComponent(item.message)}` : base
    window.open(url, '_blank', 'noopener,noreferrer')
    showToastMessage('Opening WhatsApp Chat...')
  }

  // Delete history item
  const handleDeleteHistory = (id) => {
    const updated = history.filter(item => item.id !== id)
    setHistory(updated)
    localStorage.setItem('whats_direct_history', JSON.stringify(updated))
    showToastMessage('History item removed')
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
          <svg className="toast-icon" viewBox="0 0 24 24">
            {toast.type === 'success' ? (
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            ) : (
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            )}
          </svg>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="logo-wrapper">
          {/* Precise, High-Quality Bootstrap WhatsApp SVG */}
          <svg className="logo-icon" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
          </svg>
        </div>
        <h1>WhatsDirect</h1>
        <p>Send messages on WhatsApp directly to any number without saving them in your contact list.</p>
      </header>

      {/* Form Card */}
      <main className="card">
        <form onSubmit={handleChat}>
          {/* Phone Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="phone-input">
              <span>Mobile Number</span>
              <span className="required-badge">Required</span>
            </label>
            <div className="input-wrapper">
              <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <input
                id="phone-input"
                className="text-input"
                type="tel"
                placeholder="Enter 10-digit number or with country code"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            
            {/* Contextual Smart Country Code Alerts */}
            {phone && (
              <>
                {hasAutoPrepended && (
                  <div className="country-badge-alert">
                    <span>🇮🇳</span>
                    <span>Auto-prepending India code (+91)</span>
                  </div>
                )}
                {isValidPhone && (
                  <div className="phone-preview-detail">
                    <span>Target:</span>
                    <strong>{displayTarget}</strong>
                  </div>
                )}
                {!isValidPhone && (
                  <span className="input-helper error">Enter a valid mobile number (min 7 digits).</span>
                )}
              </>
            )}
            {!phone && (
              <span className="input-helper">Indian numbers (+91) are configured automatically if you skip the country code.</span>
            )}
          </div>

          {/* Message Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="msg-input">
              <span>Message</span>
              <span className="input-helper" style={{textTransform: 'none', marginTop: 0}}>Optional</span>
            </label>
            <textarea
              id="msg-input"
              className="text-area"
              placeholder="Type your message here (optional)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="3"
            />
          </div>

          {/* Dynamic Link Preview */}
          <div className={`link-preview ${isValidPhone ? 'active' : ''}`}>
            <span className="preview-label">Live Link Preview</span>
            <span className="preview-url">
              {isValidPhone ? generatedUrl : 'https://wa.me/number?text=message'}
            </span>
          </div>

          {/* Actions */}
          <div className="actions-group">
            <button
              className="btn-primary"
              type="submit"
              disabled={!isValidPhone}
            >
              {/* WhatsApp Icon Inside Button */}
              <svg className="btn-icon" viewBox="0 0 16 16" style={{ fill: '#ffffff' }}>
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
              </svg>
              <span>Chat on WhatsApp</span>
            </button>

            <div className="secondary-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={handleCopyLink}
                disabled={!isValidPhone}
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ stroke: 'var(--text-primary)' }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>Copy Link</span>
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={handleClear}
                disabled={!phone && !message}
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ stroke: 'var(--text-primary)' }}>
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                </svg>
                <span>Clear</span>
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* History Card */}
      {history.length > 0 && (
        <section className="history-section">
          <h2 className="section-title">
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: 'var(--text-secondary)'}}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Recent Chats</span>
          </h2>
          <div className="card history-card">
            <ul className="history-list">
              {history.map((item) => (
                <li key={item.id} className="history-item">
                  <div className="history-info">
                    <span className="history-phone">{formatDisplayPhone(item.phone)}</span>
                    {item.message ? (
                      <span className="history-msg">{item.message}</span>
                    ) : (
                      <span className="history-msg" style={{fontStyle: 'italic', opacity: 0.5}}>No message</span>
                    )}
                  </div>
                  <div className="history-actions">
                    <button
                      className="btn-history-action btn-history-chat"
                      title="Open chat"
                      onClick={() => handleHistoryChat(item)}
                    >
                      <svg className="btn-icon" viewBox="0 0 16 16" style={{ fill: 'currentColor' }}>
                        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                      </svg>
                    </button>
                    <button
                      className="btn-history-action btn-history-delete"
                      title="Delete entry"
                      onClick={() => handleDeleteHistory(item.id)}
                    >
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Footer Info */}
      <footer className="footer">
        <p>Processed entirely in your browser — your phone numbers and messages are never stored on any server.</p>
        <p>WhatsDirect is not affiliated with WhatsApp Inc.</p>
      </footer>
    </div>
  )
}

export default App
