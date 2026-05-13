import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, User, Bot, Sparkles, X, PanelRightOpen, PanelRightClose, Loader2 } from 'lucide-react';
import { useAIAgentStore } from '@/stores/aiAgentStore';
import { Button } from '@/components/ui';

export const AIPanel: React.FC = () => {
  const { messages, isLoading, addMessage, setIsLoading, clearMessages } = useAIAgentStore();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = { role: 'user' as const, content: inputValue.trim(), timestamp: new Date() };
    addMessage(userMsg);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, agent_type: 'general' }),
      });
      const data = await response.json();
      addMessage({
        role: 'assistant',
        content: data.response || 'عذراً، تعذر الحصول على رد.',
        timestamp: new Date(),
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed top-0 left-0 h-full w-96 z-40 border-r border-masar-border/50 bg-masar-bg/95 backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-masar-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-masar-blue to-masar-cyan flex items-center justify-center shadow-lg shadow-masar-cyan/20">
                  <Brain size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-masar-text">المساعد الذكي</h3>
                  <p className="text-xs text-masar-text-muted"> powered by NVIDIA AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg bg-masar-surface/50 border border-masar-border/30 text-masar-text-muted hover:text-masar-cyan hover:border-masar-cyan/30 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" dir="ltr">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed
                      ${
                        msg.role === 'user'
                          ? 'bg-masar-blue/20 text-masar-text border border-masar-blue/20'
                          : 'bg-masar-surface text-masar-text-muted border border-masar-border/50'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {msg.role === 'assistant' ? (
                        <Bot size={14} className="text-masar-cyan" />
                      ) : (
                        <User size={14} className="text-masar-blue" />
                      )}
                      <span className="text-xs opacity-50">
                        {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-masar-surface/80 border border-masar-border/40 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-masar-text-muted text-xs">
                      <Loader2 size={16} className="animate-spin text-masar-cyan" />
                      <span>جاري التفكير...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-masar-border/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={clearMessages}
                  className="p-2.5 rounded-xl bg-masar-surface/50 border border-masar-border/30 text-masar-text-muted hover:text-masar-cyan hover:border-masar-cyan/30 transition-all text-xs"
                  title="مسح المحادثة"
                >
                  مسح
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب سؤالك..."
                    className="w-full px-4 py-2.5 rounded-xl bg-masar-surface/50 border border-masar-border/50 text-masar-text text-sm
                      focus:outline-none focus:border-masar-cyan/50 focus:ring-1 focus:ring-masar-cyan/20 transition-all"
                  />
                </div>
                <Button variant="primary" size="sm" onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-masar-blue to-masar-cyan shadow-xl shadow-masar-cyan/20 flex items-center justify-center text-white border border-masar-cyan/30"
        >
          <Sparkles size={24} />
        </motion.button>
      )}
    </>
  );
};
