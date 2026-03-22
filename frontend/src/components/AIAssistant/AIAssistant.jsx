import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";

const SUGGESTED_PROMPTS = [
  "Show employees with missing salary",
  "Find employees joined this month",
  "Summarize payroll data",
  "Explain PF/ESIC calculation",
  "Draft welcome email for new employee"
];

const escapeHtml = input =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderSimpleMarkdown = text => {
  const safe = escapeHtml(text || "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const lines = safe.split("\n");

  let inList = false;
  let html = "";

  lines.forEach(line => {
    const trimmed = line.trim();
    const isListItem = /^[-*]\s+/.test(trimmed);

    if (isListItem) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${trimmed.replace(/^[-*]\s+/, "")}</li>`;
      return;
    }

    if (inList) {
      html += "</ul>";
      inList = false;
    }

    if (trimmed.length === 0) {
      html += "<br />";
    } else {
      html += `<p>${trimmed}</p>`;
    }
  });

  if (inList) {
    html += "</ul>";
  }

  return html;
};

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, open]);

  const sendMessage = async explicitMessage => {
    const text = (explicitMessage ?? input).trim();
    if (!text || loading) {
      return;
    }

    const userMessage = { role: "user", content: text };
    const history = [...messages, userMessage];

    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { messages: history });
      const reply =
        res.data?.reply ||
        "I could not generate a response right now. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Unable to reach AI assistant right now. Please try again shortly.";
      setMessages(prev => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = e => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <>
      <button
        className="ai-assistant-trigger"
        type="button"
        onClick={() => setOpen(prev => !prev)}
      >
        {open ? "Close AI" : "AI Assistant"}
      </button>

      {open && (
        <div className="ai-assistant-panel" role="dialog" aria-label="AI Assistant panel">
          <div className="ai-assistant-header">
            <h3>AI Assistant</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">
              x
            </button>
          </div>

          {messages.length === 0 && (
            <div className="ai-suggested-prompts">
              {SUGGESTED_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  className="ai-prompt-chip"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="ai-assistant-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`ai-message ai-message-${message.role}`}
              >
                {message.role === "assistant" ? (
                  <div
                    className="ai-message-markdown"
                    dangerouslySetInnerHTML={{
                      __html: renderSimpleMarkdown(message.content)
                    }}
                  />
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-message ai-message-assistant ai-loading">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="ai-assistant-input" onSubmit={onSubmit}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about employees or payroll..."
              disabled={loading}
            />
            <button type="submit" disabled={!canSend}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
