import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  MicrophoneIcon,
  StopIcon,
  SunIcon,
  MoonIcon
} from "@heroicons/react/24/outline";

// 1. Import the utility
import { downloadPDF } from "../utils/downloadPdf";

const ChatBox = () => {
  // ------------- STATE VARIABLES -------------
  const [messages, setMessages] = useState([
    {
      sender: "Nexus",
      text: "Hi, I am Nexus, your deep research partner.\nTo start the research, please provide a topic."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [stage, setStage] = useState("start");
  const [isLoading, setIsLoading] = useState(false);
  const [cumulativeFeedback, setCumulativeFeedback] = useState("");
  const [topic, setTopic] = useState("");
  const [finalReportText, setFinalReportText] = useState("");
  const [approvalPending, setApprovalPending] = useState(false);

  // ------------- DARK MODE STATE -------------
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // ------------- SPEECH TO TEXT STATES -------------
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ------------- RESET CONVERSATION (Including Backend Reset) -------------
  const resetConversation = async () => {
    try {
      await axios.post("http://localhost:8000/api/reset");
    } catch (error) {
      console.error("Error resetting backend agent:", error);
    } finally {
      // Append a separator message to mark the start of a new conversation.
      setMessages((prev) => [
        ...prev,
        {
          sender: "Nexus",
          text: "Let's do another topic. What would you like to research?"
        }
      ]);
      // Reset conversation state for the agent,
      // but DO NOT clear finalReportText so that the PDF remains available.
      setChatInput("");
      setStage("start");
      setCumulativeFeedback("");
      setTopic("");
      setApprovalPending(false);
    }
  };

  // ------------- SEND MESSAGE LOGIC -------------
  const handleSendMessage = async () => {
    if (!chatInput.trim() || approvalPending) return; // Prevent sending if input is empty or approval is pending
    const userMessage = chatInput.trim();

    setMessages((prev) => [...prev, { sender: "You", text: userMessage }]);
    setChatInput("");
    setIsLoading(true);

    try {
      if (stage === "start") {
        setTopic(userMessage);
        // Show a progress message while drafting the report plan.
        setMessages((prev) => [
          ...prev,
          { sender: "Nexus", text: "Drafting a report plan. Please wait." }
        ]);
        const response = await axios.post("http://localhost:8000/api/start_research", { topic: userMessage });
        const { bot_message, approval_required } = response.data;
        const trimmedBotMessage = bot_message.split("Pass 'true'")[0].trim();
        const finalMessage = `${trimmedBotMessage} Click "Yes" to confirm and proceed to generate the final report, or click "No" to provide additional feedback and request revisions.`;
        setMessages((prev) => [
          ...prev,
          { sender: "Nexus", text: finalMessage, approvalRequired: approval_required }
        ]);
        setApprovalPending(approval_required);
        setStage("feedback");
      } else if (stage === "feedback") {
        // Here, if approval is not pending, user is providing free-text feedback.
        const newCumulative = cumulativeFeedback + "\n" + userMessage;
        setCumulativeFeedback(newCumulative);
        const response = await axios.post("http://localhost:8000/api/resume", { topic, approved: false, feedback: newCumulative });
        const { bot_message, approval_required } = response.data;
        setMessages((prev) => [
          ...prev,
          { sender: "Nexus", text: bot_message, approvalRequired: approval_required }
        ]);
        setApprovalPending(approval_required);
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

  // ------------- HANDLE APPROVAL BUTTON CLICKS -------------
  const handleApproval = async (approved) => {
    setApprovalPending(false);
    if (approved) {
      // User approved the report plan.
      try {
        setIsLoading(true);
        // Show a message while creating the final report.
        setMessages((prev) => [
          ...prev,
          { sender: "Nexus", text: "Creating the final report. Please wait." }
        ]);
        const response = await axios.post("http://localhost:8000/api/resume", { topic, approved: true });
        const { bot_message } = response.data;
        setFinalReportText(bot_message);
        setMessages((prev) => [
          ...prev,
          { sender: "Nexus", text: "Here is the final report:\n" + bot_message, isFinalReport: true }
        ]);
        resetConversation();
      } catch (error) {
        console.error("Approval error:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // User did not approve; prompt for feedback.
      setMessages((prev) => [
        ...prev,
        { sender: "Nexus", text: "Please share your feedback and let me know what adjustments you'd like." }
      ]);
    }
  };

  // ------------- RENDER COMPONENT -------------
  return (
    <>
      {/* Dark Mode Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-30 left-10 p-3 rounded-full 
                   bg-gray-300 dark:bg-gray-700 text-black dark:text-white 
                   shadow-lg z-50"
      >
        {darkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
      </button>

      {/* Main chat area */}
      <div className="pt-16 pb-20">
        <div className="max-w-3xl mx-auto p-4">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === "You";
            return (
              <div key={idx} className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`rounded-lg px-3 py-2 max-w-xl break-words whitespace-pre-line ${
                    isUser
                      ? "bg-blue-600 text-white self-end"
                      : "bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
                  }`}
                >
                  {msg.sender === "Nexus" ? (
                    <ReactMarkdown
                      className="prose dark:prose-invert max-w-none"
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    <div>{msg.text}</div>
                  )}
                  {/* If this is the final report message, render the download button right here */}
                  {msg.isFinalReport && (
                    <div className="mt-4">
                      <button
                        onClick={() => downloadPDF(finalReportText)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Download Final Report (PDF)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {approvalPending && (
            <div className="flex space-x-2 mt-2 justify-center">
              <button onClick={() => handleApproval(true)} className="px-4 py-2 bg-blue-600 text-white rounded">
                Yes
              </button>
              <button onClick={() => handleApproval(false)} className="px-4 py-2 bg-gray-600 text-white rounded">
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom chat input */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
        <div className="max-w-3xl mx-auto p-4 flex items-center">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 
                       rounded-l-lg bg-white dark:bg-gray-700 
                       text-black dark:text-white focus:outline-none"
            placeholder="Type your message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || approvalPending}
          />

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            className="p-2 rounded-full bg-blue-600 text-white ml-2 
                       disabled:opacity-50 flex items-center justify-center"
            disabled={isLoading || approvalPending}
          >
            {isLoading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-5 h-5 transform" />
            )}
          </button>

          {/* Record Toggle Button */}
          <button
            onClick={handleRecordToggle}
            className={`ml-2 p-2 rounded-full text-white flex items-center justify-center 
                        disabled:opacity-50 ${
              isRecording ? "bg-gray-600" : "bg-blue-600"
            }`}
            disabled={isLoading || approvalPending}
          >
            {isRecording ? (
              <StopIcon className="w-5 h-5" />
            ) : (
              <MicrophoneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatBox;
