import React, { useState, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const ChatBox = () => {
  // ------------- STATE VARIABLES -------------
  // Unified conversation log, starting with an initial greeting from Nexus.
  const [messages, setMessages] = useState([
    {
      sender: "Nexus",
      text: "Hi, I am Nexus, a deep research agent.\nPlease provide a topic."
    }
  ]);
  // Single input field for all user messages (topic and feedback)
  const [chatInput, setChatInput] = useState("");
  // Stage: "start" for topic entry, "feedback" for providing feedback, "final" when final report is received.
  const [stage, setStage] = useState("start");
  const [isLoading, setIsLoading] = useState(false);
  // Accumulate all feedback messages across turns (excluding the final "yes").
  const [cumulativeFeedback, setCumulativeFeedback] = useState("");
  // Store the initial topic for later resume calls.
  const [topic, setTopic] = useState("");

  // ------------- SPEECH TO TEXT STATES -------------
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fixed session id (if needed by backend)
  const sessionId = "default-session";

  // ------------- SEND MESSAGE LOGIC -------------
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    // Append user's message to the conversation log.
    setMessages((prev) => [...prev, { sender: "You", text: userMessage }]);
    setChatInput("");
    setIsLoading(true);

    try {
      if (stage === "start") {
        // Save the topic and call /api/start_research.
        setTopic(userMessage);
        const response = await axios.post("http://localhost:8000/api/start_research", {
          topic: userMessage,
        });
        const botReply = response.data.bot_message || "No report plan generated.";
        setMessages((prev) => [...prev, { sender: "Nexus", text: botReply }]);
        setStage("feedback");
      } else if (stage === "feedback") {
        // Check if the new message is an approval.
        if (userMessage.trim().toLowerCase() === "yes") {
          const response = await axios.post("http://localhost:8000/api/resume", {
            topic: topic,
            feedback: "yes",
          });
          const report = response.data.result || "No final report generated.";
          setMessages((prev) => [
            ...prev,
            { sender: "Nexus", text: "Here is the final report:\n" + report }
          ]);
          setStage("final");
        } else {
          // Append new feedback to cumulative feedback.
          const newCumulative = cumulativeFeedback + "\n" + userMessage;
          setCumulativeFeedback(newCumulative);
          const response = await axios.post("http://localhost:8000/api/resume", {
            topic: topic,
            feedback: newCumulative,
          });
          const botReply = response.data.result || "No updated report plan generated.";
          setMessages((prev) => [...prev, { sender: "Nexus", text: botReply }]);
          // Remain in feedback stage.
          setStage("feedback");
        }
      }
      // In stage "final", further input is disabled.
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
      audioChunksRef.current = []; // Reset audio chunks
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        // On data available: collect audio chunks.
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        // On stop: send audio for transcription.
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
      formData.append("session_id", sessionId);
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
    <div className="bg-gray-200 p-4 rounded-lg mt-8 max-w-2xl mx-auto">
      {/* Unified conversation log */}
      <div className="bg-gray-300 rounded-lg p-4 h-80 overflow-y-auto whitespace-pre-wrap">
        {messages.length === 0 ? (
          <p className="text-gray-600">Conversation will appear here...</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <strong>{msg.sender}:</strong>
              <div>
                {msg.sender === "Nexus" ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Single input field for all interactions */}
      <div className="flex mt-2">
        <input
          type="text"
          className="flex-1 px-4 py-2 border rounded-l-lg"
          placeholder="Type your message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || stage === "final"}
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600"
          disabled={isLoading || stage === "final"}
        >
          {isLoading ? "Processing..." : "Send"}
        </button>
      </div>
      {/* ------------- SPEECH TO TEXT LOGIC ------------- */}
      <div className="flex mt-2">
        <button
          onClick={handleRecordToggle}
          className={`${
            isRecording ? "bg-red-500" : "bg-green-500"
          } text-white px-4 py-2 rounded hover:opacity-90`}
          disabled={isLoading || stage === "final"}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
