import { useState } from "react";
import API from "../api";

export default function ChatWidget({ onDepartmentSuggestion }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Describe your symptoms and I will suggest self-care, the right department, or a doctor referral.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const submitMessage = async () => {
    if (!message.trim() || loading) {
      return;
    }

    const nextMessage = message.trim();
    setMessages((current) => [...current, { role: "user", content: nextMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const { data } = await API.post("chat/", { message: nextMessage });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `${data.reply} Next step: ${data.next_step}`,
        },
      ]);
      if (data.department_slug) {
        onDepartmentSuggestion(data.department_slug);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I couldn't process that just now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chat-widget ${open ? "open" : ""}`}>
      <button className="chat-trigger" onClick={() => setOpen((value) => !value)}>
        {open ? "Close AI Chat" : "AI Triage"}
      </button>

      {open ? (
        <div className="chat-panel">
          <div className="chat-messages">
            {messages.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={`chat-bubble ${entry.role}`}>
                {entry.content}
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <textarea
              rows="3"
              placeholder="Example: I feel anxious and cannot sleep..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <button onClick={submitMessage} disabled={loading}>
              {loading ? "Analysing..." : "Send"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
