import React, { useState, useRef } from "react";
import axios from "axios";

const ChatBox = () => {
  // ------------- STATE VARIABLES -------------
  const [topic, setTopic] = useState("");
  const [feedback, setFeedback] = useState("");
  const [botMessage, setBotMessage] = useState("");
  const [finalReport, setFinalReport] = useState("");
  const [stage, setStage] = useState("start"); // "start", "feedback", "final"
  const [isLoading, setIsLoading] = useState(false);

  // ------------- SPEECH TO TEXT STATES -------------
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // For simplicity, use a fixed session ID if needed.
  const sessionId = "default-session";

  // ------------- SEND TEXT MESSAGE (for topic or feedback) -------------
  const handleSendMessage = async () => {
    if (stage === "start") {
      if (!topic.trim()) return;
      setIsLoading(true);
      try {
        // Call start_research endpoint
        const response = await axios.post("http://localhost:8000/api/start_research", {
          topic: topic,
        });
        const botReply = response.data.bot_message || "No report plan generated.";
        // Display the bot's report plan
        setBotMessage(botReply);
        setStage("feedback");
      } catch (error) {
        console.error("Error starting research:", error);
      } finally {
        setIsLoading(false);
      }
    } else if (stage === "feedback") {
      if (!feedback.trim()) return;
      setIsLoading(true);
      try {
        // Call resume endpoint with user feedback
        const response = await axios.post("http://localhost:8000/api/resume", {
          feedback: feedback,
        });
        const report = response.data.report || "No final report generated.";
        setFinalReport(report);
        setStage("final");
      } catch (error) {
        console.error("Error resuming research:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle key down for pressing Enter to send message
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ------------- SPEECH TO TEXT LOGIC -------------
  const handleRecordToggle = async () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      audioChunksRef.current = []; // Reset the chunks

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        // On dataavailable: collect audio chunks
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        // On stop: send the audio for transcription
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
      // Stop recording
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
      // Insert the transcript into the chat input (for topic in stage "start" or feedback in stage "feedback")
      if (stage === "start") {
        setTopic(transcript);
      } else if (stage === "feedback") {
        setFeedback(transcript);
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ------------- RENDER COMPONENT -------------
  return (
    <div className="container mx-auto p-4">
      {stage === "start" && (
        <div>
          <h2 className="text-2xl font-bold">Enter Report Topic</h2>
          <input
            type="text"
            placeholder="Topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border p-2 w-full mb-2"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white py-2 px-4 rounded"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Start Research"}
          </button>
        </div>
      )}
      {stage === "feedback" && (
        <div>
          <h2 className="text-2xl font-bold">Bot's Report Plan</h2>
          <pre className="bg-gray-100 p-4 mb-4">{botMessage}</pre>
          <h3 className="text-xl">Enter your feedback:</h3>
          <input
            type="text"
            placeholder="Feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border p-2 w-full mb-2"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="bg-green-500 text-white py-2 px-4 rounded"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      )}
      {stage === "final" && (
        <div>
          <h2 className="text-2xl font-bold">Final Report</h2>
          <pre className="bg-gray-100 p-4">{finalReport}</pre>
        </div>
      )}

      {/* Chat conversation log (optional) */}
      <div className="mt-8">
        <h3 className="text-xl font-bold">Conversation Log</h3>
        <div className="border p-4 max-h-64 overflow-y-auto">
          {stage === "start" && <p>Waiting for topic...</p>}
          {stage === "feedback" && (
            <>
              <p><strong>You:</strong> {topic}</p>
              <p><strong>Bot:</strong> {botMessage}</p>
            </>
          )}
          {stage === "final" && (
            <>
              <p><strong>You:</strong> {feedback}</p>
              <p><strong>Bot:</strong> {finalReport}</p>
            </>
          )}
        </div>
      </div>

      {/* ------------- SPEECH TO TEXT LOGIC ------------- */}
      <div className="flex mt-4">
        <button
          onClick={handleRecordToggle}
          className={`${
            isRecording ? "bg-red-500" : "bg-green-500"
          } text-white px-4 py-2 rounded hover:opacity-90`}
          disabled={isLoading}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
