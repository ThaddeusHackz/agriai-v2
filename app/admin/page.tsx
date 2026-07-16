"use client";

import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [heroTitle, setHeroTitle] = useState("The Future of Farming in Ghana");
  const [heroSubtitle, setHeroSubtitle] = useState("AI that speaks your language.");
  const [primaryColor, setPrimaryColor] = useState("#00c853");
  const [showVoice, setShowVoice] = useState(true);
  const [showExpert, setShowExpert] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();

        if (data.heroTitle) setHeroTitle(data.heroTitle);
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
        if (data.showVoice !== undefined) setShowVoice(data.showVoice === 'true');
        if (data.showExpert !== undefined) setShowExpert(data.showExpert === 'true');
      } catch (error) {
        console.log("No saved settings found");
      }
    };

    loadSettings();
  }, []);

  // Save settings to database
  const saveChanges = async () => {
    setLoading(true);
    setMessage("");

    const settings = {
      heroTitle,
      heroSubtitle,
      primaryColor,
      showVoice: showVoice.toString(),
      showExpert: showExpert.toString()
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setMessage("Settings saved successfully!");
      } else {
        setMessage("Failed to save settings");
      }
    } catch (error) {
      setMessage("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">AgriAI Admin Panel</h1>
          <a href="/" className="text-sm px-4 py-2 border rounded-full hover:bg-gray-50">← Back to Site</a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hero Settings */}
          <div className="border rounded-3xl p-8">
            <h2 className="text-xl font-semibold mb-6">Hero Section</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm mb-2">Hero Title</label>
                <input 
                  type="text" 
                  value={heroTitle} 
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full border px-4 py-3 rounded-2xl" 
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Subtitle</label>
                <input 
                  type="text" 
                  value={heroSubtitle} 
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full border px-4 py-3 rounded-2xl" 
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Primary Color</label>
                <input 
                  type="color" 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10" 
                />
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="border rounded-3xl p-8">
            <h2 className="text-xl font-semibold mb-6">Features</h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between border p-4 rounded-2xl">
                <div>Voice Input &amp; Output</div>
                <input 
                  type="checkbox" 
                  checked={showVoice} 
                  onChange={(e) => setShowVoice(e.target.checked)} 
                />
              </label>

              <label className="flex items-center justify-between border p-4 rounded-2xl">
                <div>Expert Mode</div>
                <input 
                  type="checkbox" 
                  checked={showExpert} 
                  onChange={(e) => setShowExpert(e.target.checked)} 
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={saveChanges}
            disabled={loading}
            className="px-10 py-4 bg-[#00c853] text-white rounded-3xl font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save All Changes"}
          </button>
          
          {message && (
            <p className="mt-4 text-sm text-gray-600">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
