import React, { useState, useRef, useEffect } from 'react';
import { UploadedFile, ChatMessage } from '../types';
import { generateThinkingResponse } from '../services/geminiService';
import { Send, Bot, User, Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import Button from './Button';

interface ThinkingAssistantProps {
  files: UploadedFile[];
}

const ThinkingAssistant: React.FC<ThinkingAssistantProps> = ({ files }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'I am Orion AI, powered by Gemini 3.0 Pro. I can analyze your images, suggest compression settings, or explain complex media engineering concepts. Select an image below to attach it to our conversation.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedFileId) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const selectedFile = files.find(f => f.id === selectedFileId);
      
      // Let Gemini think
      let responseText = await generateThinkingResponse(
        userMsg.text || (selectedFile ? "Please analyze this image." : "Hello"),
        selectedFile ? selectedFile.previewUrl : undefined
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I couldn't generate a response."
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error while thinking. Please try again."
      }]);
    } finally {
      setIsLoading(false);
      setSelectedFileId(null); // Clear selection after sending
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
           <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
             <Sparkles className="w-5 h-5" />
           </div>
           <div>
             <h3 className="font-semibold text-slate-900">Orion Intelligence</h3>
             <p className="text-xs text-slate-500">Powered by Gemini 3.0 Pro Thinking Mode</p>
           </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-green-600 text-white'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-indigo-50 text-indigo-900 rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
              }`}>
                {/* Basic Markdown-like rendering for Gemini responses */}
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className="mb-1 last:mb-0">{line}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex flex-row items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                 <Bot className="w-4 h-4" />
               </div>
               <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                 <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                 <span className="text-xs text-slate-500 font-medium animate-pulse">Thinking deeply...</span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context Selection (Files) */}
      {files.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 p-2 overflow-x-auto">
            <div className="flex space-x-2">
                {files.map(file => (
                    <button
                        key={file.id}
                        onClick={() => setSelectedFileId(selectedFileId === file.id ? null : file.id)}
                        className={`relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedFileId === file.id ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                    >
                        <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover" />
                        {selectedFileId === file.id && (
                            <div className="absolute inset-0 bg-indigo-900/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 px-1">Select an image to add context to your query</p>
          </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
             <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder={selectedFileId ? "Ask about this image..." : "Ask Orion about image compression, formats, or anything..."}
                className="w-full resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none max-h-32"
                rows={1}
             />
          </div>
          <Button onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedFileId)} className="rounded-xl h-[46px] w-[46px] flex items-center justify-center p-0">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThinkingAssistant;