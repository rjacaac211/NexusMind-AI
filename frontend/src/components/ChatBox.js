import React, { useState, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const ChatBox = () => {
  // ------------- STATE VARIABLES -------------
  const [messages, setMessages] = useState([
    {
      sender: "Nexus",
      text: "Hi, I am Nexus, a deep research agent.\nPlease provide a topic."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [stage, setStage] = useState("start");
  const [isLoading, setIsLoading] = useState(false);
  const [cumulativeFeedback, setCumulativeFeedback] = useState("");
  const [topic, setTopic] = useState("");

  // ------------- SPEECH TO TEXT -------------
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ------------- SEND MESSAGE LOGIC -------------
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();

    setMessages((prev) => [...prev, { sender: "You", text: userMessage }]);
    setChatInput("");
    setIsLoading(true);

    try {
      if (stage === "start") {
        setTopic(userMessage);
        const response = await axios.post("http://localhost:8000/api/start_research", {
          topic: userMessage,
        });
        const botReply = response.data.bot_message || "No report plan generated.";
        setMessages((prev) => [...prev, { sender: "Nexus", text: botReply }]);
        setStage("feedback");
      } else if (stage === "feedback") {
        if (userMessage.toLowerCase() === "yes") {
          const response = await axios.post("http://localhost:8000/api/resume", {
            topic,
            feedback: "yes",
          });
          const report = response.data.result || "No final report generated.";
          setMessages((prev) => [
            ...prev,
            { sender: "Nexus", text: "Here is the final report:\n" + report }
          ]);
          setStage("final");
        } else {
          const newCumulative = cumulativeFeedback + "\n" + userMessage;
          setCumulativeFeedback(newCumulative);
          const response = await axios.post("http://localhost:8000/api/resume", {
            topic,
            feedback: newCumulative,
          });
          const botReply = response.data.result || "No updated report plan generated.";
          setMessages((prev) => [...prev, { sender: "Nexus", text: botReply }]);
          setStage("feedback");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "Nexus", text: "Error processing your request." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------- HANDLE KEY DOWN -------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ------------- SPEECH TO TEXT LOGIC -------------
  const handleRecordToggle = async () => {
    if (!isRecording) {
      setIsRecording(true);
      audioChunksRef.current = [];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          await sendAudioForTranscription(audioBlob);
        };

        mediaRecorder.start();
      } catch (err) {
        console.error("Could not start recording:", err);
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const sendAudioForTranscription = async (audioBlob) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");
      formData.append("session_id", "default-session");
      const res = await axios.post("http://localhost:8000/api/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const transcript = res.data.transcript || "";
      setChatInput(transcript);
    } catch (error) {
      console.error("Error transcribing audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------- RENDER COMPONENT -------------
  return (
    <div className="max-w-2xl mx-auto mt-8">
      {/* Chat area container */}
      <div className="rounded-lg p-4 h-80 overflow-y-auto border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
        {messages.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">Conversation will appear here...</p>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === "You";
            return (
              <div
                key={idx}
                className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-xs break-words ${
                    isUser
                      ? "bg-blue-600 text-white self-end"
                      : "bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">{msg.sender}</div>
                  {msg.sender === "Nexus" ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    <div>{msg.text}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input row */}
      <div className="flex mt-4">
        <input
          type="text"
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-l-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none"
          placeholder="Type your message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || stage === "final"}
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
          disabled={isLoading || stage === "final"}
        >
          {isLoading ? "Processing..." : "Send"}
        </button>
      </div>

      {/* Speech-to-text button */}
      <div className="flex mt-2">
        <button
          onClick={handleRecordToggle}
          className={`${
            isRecording ? "bg-red-600" : "bg-green-600"
          } text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50`}
          disabled={isLoading || stage === "final"}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
