import React, { useState } from 'react';
import { askAiAssistant } from '../services/api';

export default function AiAssistantDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your B.Tech Academic & Placement AI Mentor powered by Gemini 3.8 Flash. Ask me about your semester course syllabus, lab viva questions, coding interview preparation (DSA/LeetCode), or closing skill gaps.',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isGenerating) return;

    const newMsgs = [...messages, { sender: 'user', text: prompt }];
    setMessages(newMsgs);
    setInputPrompt('');
    setIsGenerating(true);

    try {
      const res = await askAiAssistant(prompt);
      setMessages([
        ...newMsgs,
        {
          sender: 'bot',
          text: res.data?.response || 'I am ready to assist with your B.Tech syllabus and placement inquiries.',
        },
      ]);
    } catch (err) {
      console.error('AI mentor error:', err);
      setMessages([
        ...newMsgs,
        {
          sender: 'bot',
          text: 'I could not connect to the backend AI service. Please verify port 8081 is running.',
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const samplePrompts = [
    'Explain B.Tech DSA syllabus and recommended study roadmap',
    'How do I prepare for OS Process Scheduling & Concurrency viva?',
    'Recommend a 30-day plan to master DBMS & SQL normalization',
    'What skills do I need to prepare for Campus Placement Coding Rounds?',
  ];

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content rounded-4 border-0 shadow-lg">
          {/* Header */}
          <div className="modal-header border-0 pb-2 pt-4 px-4 bg-light rounded-top-4" style={{ borderBottom: '2px solid var(--blue-border)' }}>
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-3 p-2 text-white"
                style={{ background: 'var(--gradient-blue-red)' }}
              >
                <i className="bi bi-robot fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0 text-dark">B.Tech AI Academic & Placement Mentor</h5>
                <span className="badge bg-white text-danger border border-danger-subtle small fw-semibold">
                  <i className="bi bi-gem me-1"></i> Gemini 3.8 Flash / RAG Syllabus Layer
                </span>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 bg-light border-bottom">
            <div className="small text-muted mb-1 fw-semibold">Quick Engineering Queries:</div>
            <div className="d-flex gap-1 overflow-auto pb-1">
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  className="btn btn-sm btn-outline-secondary text-nowrap rounded-pill py-0 px-2 small"
                  onClick={() => handleSend(p)}
                  disabled={isGenerating}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Message List */}
          <div
            className="modal-body p-4"
            style={{ height: '420px', overflowY: 'auto', backgroundColor: '#f8fafc' }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={m.sender === 'user' ? 'ai-bubble-user' : 'ai-bubble-bot'}
              >
                <div className="small fw-bold mb-1 opacity-75">
                  {m.sender === 'user' ? 'Rahul (Student)' : 'Capacity Connect AI Mentor'}
                </div>
                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.55' }}>{m.text}</div>
              </div>
            ))}

            {isGenerating && (
              <div className="ai-bubble-bot text-muted">
                <span className="spinner-grow spinner-grow-sm me-2 text-danger" role="status"></span>
                Consulting B.Tech curriculum & synthesizing guidance with Gemini 3.8 Flash...
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="modal-footer border-0 p-3 bg-white rounded-bottom-4">
            <form
              className="input-group"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                className="form-control rounded-start-pill ps-3"
                placeholder="Ask anything about B.Tech course syllabus, viva questions, or coding interview prep..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <button
                type="submit"
                className="btn btn-red-accent rounded-end-pill px-4"
                disabled={isGenerating || !inputPrompt.trim()}
              >
                <i className="bi bi-send-fill me-1"></i> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
