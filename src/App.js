import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const API_URL = "https://llm-chatbot-uplx.onrender.com/reply"; 

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const currentInput = input;
    setInput("");

    const assistantMsg = { role: "assistant", text: "" };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsStreaming(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentInput, stream: true }),
      });

      if (!response.body) {
        throw new Error("Streaming not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      let accumulated = "";
/* eslint-disable no-loop-func */

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              text: accumulated,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error streaming response." },
      ]);
    }

    setIsStreaming(false);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <div className="container">
      <h2 className="title">AI Assistant</h2>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.role === "user" ? "user" : "assistant"}`}
          >
            {msg.text}
          </div>
        ))}

        {isStreaming && <div className="loading">Assistant is typing…</div>}

        <div ref={chatEndRef} />
      </div>

      <div className="input-row">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message…"
        />
        <button className="send-btn" onClick={sendMessage} disabled={isStreaming}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
