"use client";

import React, { useState } from 'react';
import { Leaf, Mic, MicOff, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function AgriAI() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', content: "Hello! I'm AgriAI — your intelligent farming assistant for Ghana." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const quickPrompts = [
    "Best time to plant maize in Ghana",
    "How to treat cassava mosaic disease",
    "Current cocoa price in Kumasi"
  ];

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), language: selectedLanguage })
      });
      const data = await res.json();

      const aiMsg: Message = { id: Date.now() + 1, role: 'assistant', content: data.response };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      toast.error("Failed to connect");
    } finally {
      setIsLoading(false);
    }
  };

  // Hybrid Voice Input: Browser + OpenAI Whisper fallback
  const toggleVoice = async () => {
    if (!isRecording) {
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = selectedLanguage === 'en' ? 'en-GH' : 'en';
        setIsRecording(true);

        recognition.onresult = (event: any) => {
          setInput(event.results[0][0].transcript);
          setIsRecording(false);
        };

        recognition.onerror = async () => {
          setIsRecording(false);
          toast.info("Using OpenAI Whisper...");
          await startWhisperRecording();
        };

        recognition.start();
      } else {
        await startWhisperRecording();
      }
    } else {
      setIsRecording(false);
    }
  };

  // OpenAI Whisper Recording
  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          });
          const data = await res.json();
          if (data.text) setInput(data.text);
        } catch {
          toast.error("Transcription failed");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
        }
      }, 8000);
    } catch {
      toast.error("Microphone access denied");
      setIsRecording(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="min-h-screen bg-white text-[#111]">
      {/* NAV */}
      <nav className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#00c853] rounded-2xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="font-semibold text-2xl tracking-tight">AgriAI</div>
          </div>
          <a href="/admin" className="px-5 py-2 rounded-full border hover:bg-gray-50">Admin</a>
        </div>
      </nav>

      {/* HERO */}
      <div className="max-w-4xl mx-auto px-8 pt-14 pb-8 text-center">
        <h1 className="text-6xl font-semibold tracking-tighter mb-3">The Future of Farming in Ghana</h1>
        <p className="text-xl text-gray-600">AI that speaks your language.</p>
      </div>

      {/* CHAT - PERPLEXITY STYLE */}
      <div className="max-w-[780px] mx-auto px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-xl">
          
          {/* Header */}
          <div className="px-8 py-5 border-b flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00c853] rounded-2xl flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <div className="font-semibold">AgriAI Assistant</div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[440px] overflow-y-auto p-8 space-y-6 bg-white">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] px-6 py-4 rounded-3xl text-[15.5px] leading-[1.65]
                  ${msg.role === 'user' 
                    ? 'bg-[#00c853] text-white rounded-br-none' 
                    : 'bg-gray-100 text-[#111] rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="px-2 text-gray-500">Thinking...</div>}
          </div>

          {/* INPUT AREA - CLEAN & MODERN */}
          <div className="p-6 border-t bg-white">
            
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => { setInput(prompt); setTimeout(sendMessage, 20); }}
                  className="text-xs px-4 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleVoice} 
                className={`p-4 rounded-2xl transition ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <select 
                value={selectedLanguage} 
                onChange={e => setSelectedLanguage(e.target.value)} 
                className="bg-gray-100 border border-gray-200 px-4 py-3 rounded-2xl text-sm"
              >
                <option value="en">English</option>
                <option value="tw">Twi</option>
                <option value="ga">Ga</option>
                <option value="ee">Ewe</option>
                <option value="ha">Hausa</option>
              </select>

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about crops, weather, market prices..."
                className="flex-1 border border-gray-200 px-6 py-4 rounded-3xl text-[#111] placeholder:text-gray-400 focus:outline-none focus:border-[#00c853] text-[15px]"
              />

              <button 
                onClick={sendMessage} 
                disabled={!input.trim() || isLoading}
                className="bg-[#00c853] hover:bg-[#00b347] disabled:opacity-50 p-4 rounded-3xl text-white transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
