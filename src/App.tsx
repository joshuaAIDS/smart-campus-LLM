/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MapPin, 
  Info, 
  Navigation, 
  BookOpen, 
  Coffee, 
  UserCircle, 
  MessageSquare,
  ChevronRight,
  School,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// --- Constants ---
const COLLEGE_NAME = "Panimalar Engineering College";

const SYSTEM_INSTRUCTION = `You are an AI assistant called smart Campus Connect AI.
Your purpose is to help visitors, students, parents, and staff obtain information about Panimalar Engineering College and navigate the campus easily.

COLLEGE INFORMATION:
- Name: Panimalar Engineering College
- Location: Varadharajapuram, Poonamallee, Chennai, Tamil Nadu, India
- Affiliation: Anna University
- Approval: AICTE
- Website: https://www.panimalar.ac.in
- Contact: 044-26490404, 044-26490505 | info@panimalar.ac.in

DEPARTMENTS:
- Computer Science and Engineering
- Artificial Intelligence and Data Science
- Information Technology
- Electronics and Communication Engineering
- Electrical and Electronics Engineering
- Mechanical Engineering
- Civil Engineering

FACILITIES:
- Central Library, Computer Labs, Seminar Halls, Auditorium, Canteen, Hostel Facilities, Sports Grounds, Parking Area, WiFi Campus.

LOCATIONS & NAVIGATION:
- Main Gate: Main entrance of the campus.
- Administration Block: Near the main gate.
- Admission Office: Inside the administration block.
- Library: Central academic block.
- Computer Lab: Computer Science department building.
- Canteen: Behind the main academic building.
- Parking Area: Near the campus entrance.
- Auditorium: Inside the main campus.
- Hostel: Residential area inside the campus.
- Campus Map: [View on Google Maps](https://www.google.com/maps/search/?api=1&query=Panimalar+Engineering+College+Chennai)

FEES (Approx per year):
- CSE: ₹120,000
- AI & DS: ₹120,000
- IT: ₹115,000
- ECE: ₹110,000
- EEE: ₹105,000
- MECH: ₹100,000
- CIVIL: ₹100,000

BUS ROUTES:
1. CMBT Route: CMBT → Nerkundram → Maduravoyal → Vanagaram → Velappanchavadi → Kumunanchavadi → Poonamallee → Varadharajapuram → Panimalar Engineering College
2. Broadway Route: Broadway → Chennai Central → Aminjikarai → Arumbakkam → Nerkundram → Maduravoyal → Vanagaram → Velappanchavadi → Poonamallee → Panimalar Engineering College
3. Egmore Route: Egmore → Mount Road → CMBT → Maduravoyal → Poonamallee → Panimalar Engineering College
4. Airport Route: Chennai Airport → Pallavaram → Porur → Maduravoyal → Poonamallee → Panimalar Engineering College
5. Anna Nagar Route: Anna Nagar → Mogappair → Maduravoyal → Vanagaram → Poonamallee → Panimalar Engineering College
6. Kanchipuram Route: Kanchipuram → Sriperumbudur → Poonamallee → Panimalar Engineering College

RESPONSE STYLE:
- Short, clear, helpful, and informative.
- If a user asks something unrelated to the campus, respond with: "I am the Panimalar Campus Connect assistant. I can help you with campus navigation and information about Panimalar Engineering College."`;
`COLLEGE INFORMATION:
- Name: Panimalar Engineering College
- Location: Varadharajapuram, Poonamallee, Chennai, Tamil Nadu, India
... [Keep your existing Depts/Fees/Bus data here] ...

LOCATIONS & STREET VIEW NAVIGATION:
- Main Gate: [Street View](https://www.google.com/maps/@13.0494,80.0756,3a,75y,280h,90t/data=!3m6!1e1)
- Administration Block: Near the main gate. [Street View](https://www.google.com/maps/@13.0497,80.0752,3a,75y,100h,90t/data=!3m6!1e1)
- Central Library: Central academic block. [Street View](https://www.google.com/maps/@13.0501,80.0745,3a,75y,180h,90t/data=!3m6!1e1)
- Campus Map: [View on Google Maps](https://www.google.com/maps/search/?api=1&query=Panimalar+Engineering+College+Chennai)

RESPONSE STYLE:
1. Provide short, clear, and informative answers.
2. CRITICAL: Whenever a user asks for a specific location or direction, you MUST include the corresponding [Street View] link provided in the list above.
3. If a user asks something unrelated to the campus, remind them you are the Panimalar assistant.`;
`### HOSTEL GATEPASS PROTOCOL ###
- ISSUANCE: Digital gatepasses are only issued for students going home or for medical emergencies.
- PARENT NOTIFICATION: Every time a gatepass is generated, the system automatically sends a secure SMS/WhatsApp notification to the registered parent's mobile number.
- NOTIFICATION CONTENT: "PEC Security Alert: Your ward [Name] has checked out of the hostel at [Time]. Purpose: Going Home. Destination: [Address]."

### INTERACTION RULES ###
1. If a student asks "How do I get a gatepass?" or "I want to go home":
   - Inform them they must apply through the Student Portal.
   - Mention: "Once approved, your parents will receive an automated SMS notification for your safety."
2. If a parent asks "Where is my child?":
   - Ask for the Student ID.
   - If a gatepass exists, say: "A gatepass was issued at [Time]. You should have received a notification on your registered phone."
3. SECURITY: Emphasize that parent notification is MANDATORY and cannot be disabled by the student.`


const facilities = [
  { name: "Central Library", description: "A vast collection of academic books, journals, and digital resources located in the central academic block." },
  { name: "Computer Labs", description: "High-end computing facilities with high-speed internet, located in the CSE department building." },
  { name: "Seminar Halls", description: "Equipped with modern audio-visual aids for guest lectures and technical seminars." },
  { name: "Auditorium", description: "A large, state-of-the-art auditorium for college events, cultural programs, and conferences." },
  { name: "Canteen", description: "Spacious dining area serving hygienic and nutritious food, located behind the main academic building." },
  { name: "Hostel Facilities", description: "Comfortable residential facilities for boys and girls with all necessary amenities inside the campus." },
  { name: "Sports Grounds", description: "Extensive grounds for cricket, football, basketball, and other outdoor sports activities." },
  { name: "Parking Area", description: "Dedicated parking space for students, staff, and visitors near the campus entrance." },
  { name: "WiFi Campus", description: "High-speed wireless internet connectivity available throughout the campus for students and staff." },
];

const StarField = () => {
  const stars = Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 2 + 1}px`,
    duration: `${Math.random() * 3 + 2}s`,
    delay: `${Math.random() * 5}s`,
  }));

  return (
    <div className="star-field">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            '--duration': star.duration,
            animationDelay: star.delay,
          } as any}
        />
      ))}
    </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I am the ${COLLEGE_NAME} assistant. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFacility, setActiveFacility] = useState<{name: string, description: string} | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "What are the college timings?",
    "Tell me about the CSE department",
    "How to reach the campus?",
    "What facilities are available?",
    "Admission process for 2026"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowWelcome(false);

    let assistantText = "";

    // 1. Try Gemini on Frontend first
    const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        console.log("Attempting Gemini on Frontend...");
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [...messages, userMessage].map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        if (response.text) {
          assistantText = response.text;
          console.log("Gemini Frontend success!");
        }
      } catch (geminiError: any) {
        console.warn("Gemini Frontend failed:", geminiError.message || geminiError);
        // Fall through to Backend Groq
      }
    }

    // 2. Fallback to Backend Groq if Gemini failed or no key
    if (!assistantText) {
      try {
        console.log("Falling back to Backend Groq...");
        const response = await fetch('https://smart-campus-llm.onrender.com/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
            systemInstruction: SYSTEM_INSTRUCTION,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch from server');
        }
        
        assistantText = data.text || "I'm sorry, I couldn't process that request.";
      } catch (error: any) {
        console.error('Chat Error:', error);
        if (error.message?.includes('API keys')) {
          assistantText = "API Keys are missing. Please add GEMINI_API_KEY or GROQ_API_KEY to the Secrets panel in Settings to enable the AI.";
        } else {
          assistantText = "I'm having trouble connecting right now. Please check your API keys in Settings or try again later.";
        }
      }
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: assistantText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleSuggestedClick = (q: string) => {
    setInput(q);
  };

  const quickLinks = [
    { icon: <Navigation className="w-4 h-4" />, label: "Admission Block", query: "Where is the admission office?" },
    { icon: <BookOpen className="w-4 h-4" />, label: "Library", query: "Where is the library located?" },
    { icon: <Info className="w-4 h-4" />, label: "Bus Routes", query: "What are the bus routes to the college?" },
    { icon: <Coffee className="w-4 h-4" />, label: "Fees", query: "What is the fee for CSE?" },
  ];

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative">
      <StarField />
      
      {/* Sidebar */}
      <aside className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col hidden lg:flex z-20">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black shadow-lg shadow-white/10">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white leading-tight">Panimalar</h1>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Campus Connect</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {/* Campus Status Widget */}
          <div className="bento-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Campus Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                <span className="text-[10px] font-bold text-white uppercase">Open</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Current Time</span>
                <span className="font-medium text-zinc-300">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Next Event</span>
                <span className="font-medium text-zinc-300">Tech Symposium</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Quick Navigation</h2>
            <div className="grid grid-cols-1 gap-2">
              {quickLinks.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedClick(link.query)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left border border-transparent hover:border-white/5"
                >
                  <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400 group-hover:bg-white group-hover:text-black transition-colors">
                    {link.icon}
                  </div>
                  <span className="text-sm font-medium text-zinc-400 group-hover:text-white">{link.label}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-zinc-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Campus Facilities</h2>
            <div className="grid grid-cols-1 gap-2">
              {facilities.slice(0, 5).map((facility, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFacility(facility)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all text-left group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-white transition-colors" />
                  <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300">{facility.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 space-y-3">
          <a 
            href="https://www.google.com/maps/search/?api=1&query=Panimalar+Engineering+College+Chennai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all text-sm font-bold shadow-lg shadow-white/5"
          >
            <MapIcon className="w-4 h-4" />
            Campus Map
          </a>
          <div className="flex items-center justify-center gap-2 text-zinc-600">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Chennai, India</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-transparent z-10">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Campus Assistant</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_white]" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Info className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 border border-white/5">
              <UserCircle className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide chat-container">
          <AnimatePresence mode="popLayout">
            {showWelcome && messages.length <= 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto text-center py-24 space-y-8"
              >
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-white mx-auto border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]"
                >
                  <School className="w-12 h-12" />
                </motion.div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-bold text-white tracking-tight">How can I help you today?</h3>
                  <p className="text-zinc-500 text-lg max-w-md mx-auto font-medium">
                    Panimalar Campus Connect AI
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-8">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedClick(q)}
                      className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-medium text-zinc-400 hover:border-white/40 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 max-w-[85%] lg:max-w-[75%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                    message.role === 'user' ? 'bg-white text-black' : 'bg-zinc-900 border border-white/10 text-white'
                  }`}>
                    {message.role === 'user' ? <UserCircle className="w-6 h-6" /> : <School className="w-6 h-6" />}
                  </div>
                  <div className="space-y-2">
                    <div className={`p-5 rounded-[2rem] shadow-2xl backdrop-blur-md transition-all ${
                      message.role === 'user' 
                        ? 'bg-white text-black rounded-tr-none hover:bg-zinc-100' 
                        : 'bg-zinc-900/90 border border-white/10 text-zinc-100 rounded-tl-none ai-bubble-glow hover:border-white/20'
                    }`}>
                      <div className={`text-sm lg:text-base leading-relaxed prose prose-sm max-w-none ${message.role === 'user' ? 'prose-zinc' : 'prose-invert'}`}>
                        <Markdown>{message.content}</Markdown>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                      <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex gap-4 items-center bg-zinc-900/50 px-6 py-4 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Assistant is thinking</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-8 bg-transparent">
          <div className="max-w-3xl mx-auto relative">
            <div className="absolute -top-14 left-0 right-0 flex justify-center gap-3 overflow-x-auto scrollbar-hide pb-2 px-4">
              {messages.length > 1 && suggestedQuestions.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedClick(q)}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-zinc-900/80 border border-white/10 text-[10px] font-bold text-zinc-400 hover:bg-white hover:text-black transition-all shadow-2xl uppercase tracking-widest backdrop-blur-md"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="relative flex items-center group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="How can I help you today?"
                className="w-full bg-zinc-900/80 border border-white/10 rounded-[2rem] py-5 pl-8 pr-20 text-base focus:outline-none focus:ring-4 focus:ring-white/5 focus:border-white/20 transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl text-white placeholder:text-zinc-600"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-3 p-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-xl"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6">
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                Panimalar Connect
              </p>
              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                AI Assistant
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Facility Modal */}
      <AnimatePresence>
        {activeFacility && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setActiveFacility(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white mb-8 border border-white/10">
                <BookOpen className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">{activeFacility.name}</h3>
              <p className="text-zinc-400 text-base leading-relaxed mb-10">
                {activeFacility.description}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    handleSuggestedClick(`Tell me more about ${activeFacility.name}`);
                    setActiveFacility(null);
                  }}
                  className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-all shadow-xl"
                >
                  Ask Assistant
                </button>
                <button
                  onClick={() => setActiveFacility(null)}
                  className="flex-1 py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-bold text-sm hover:bg-zinc-700 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
