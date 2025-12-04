// chat.js – front‑end widget that calls the Cloudflare Worker RAG endpoint at /api/chat

function setupChat() {
  const launcher = document.getElementById("chat-launcher");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const messages = document.getElementById("chat-messages");

  if (!launcher || !panel || !form || !input || !messages) return;

  const togglePanel = (open) => {
    const isOpen = open ?? !panel.classList.contains("chat-panel--open");
    if (isOpen) {
      panel.classList.add("chat-panel--open");
      panel.setAttribute("aria-hidden", "false");
      input.focus();
    } else {
      panel.classList.remove("chat-panel--open");
      panel.setAttribute("aria-hidden", "true");
    }
  };

  launcher.addEventListener("click", () => togglePanel(true));
  if (closeBtn) closeBtn.addEventListener("click", () => togglePanel(false));

  const appendMessage = (role, text) => {
    const wrapper = document.createElement("div");
    wrapper.className =
      "chat-message " +
      (role === "user" ? "chat-message--user" : "chat-message--assistant");
    const meta = document.createElement("div");
    meta.className = "chat-message-meta";
    meta.textContent = role === "user" ? "You" : "Assistant";

    const body = document.createElement("div");
    body.textContent = text;

    wrapper.appendChild(meta);
    wrapper.appendChild(body);
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  };

  const setLoading = (loading) => {
    sendBtn.disabled = loading;
    input.disabled = loading;
  };

  const getPageContext = () => {
    const path = window.location.pathname || "/";
    if (path.includes("business")) return "business";
    if (path.includes("support")) return "support";
    if (path.includes("members")) return "members";
    if (path.includes("contact")) return "contact";
    return "home";
  };

  async function handleSubmit(evt) {
    evt.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    appendMessage("user", text);
    input.value = "";
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          page: getPageContext(),
        }),
      });
      if (!res.ok) throw new Error("Chat API error " + res.status);
      const data = await res.json();
      appendMessage("assistant", data.answer || "I’m not sure how to answer that yet.");
    } catch (err) {
      console.error(err);
      appendMessage(
        "assistant",
        "Sorry, I couldn’t reach the help service just now. Please try again later or use the contact page."
      );
    } finally {
      setLoading(false);
      input.focus();
    }
  }

  form.addEventListener("submit", handleSubmit);
}

document.addEventListener("DOMContentLoaded", setupChat);
