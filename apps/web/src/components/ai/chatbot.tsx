"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, X, Minimize2, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  intent?: string;
}

interface QuickReply {
  label: string;
  action: string;
}

const QUICK_REPLIES: QuickReply[] = [
  { label: "Check Stock", action: "check stock levels" },
  { label: "Low Stock Alerts", action: "show low stock items" },
  { label: "Create Order", action: "create a new order" },
  { label: "Sales Report", action: "show today's sales" },
  { label: "Help", action: "help" },
];

export function AIChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session
    initializeSession();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const initializeSession = async () => {
    try {
      const response = await fetch("/api/chat/session", {
        method: "POST",
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        
        // Add welcome message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your AI assistant. I can help you with inventory management, stock checks, orders, and more. How can I help you today?",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error initializing chat session:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (messageText: string = input) => {
    if (!messageText.trim() || !sessionId) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: messageText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: data.id || Math.random().toString(36),
          role: "assistant",
          content: data.content,
          timestamp: new Date(data.timestamp),
          intent: data.intent,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: "error",
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.action);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 shadow-2xl transition-all ${
      isMinimized ? "h-14" : "h-[600px]"
    } w-96 flex flex-col z-50`}>
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">AI Assistant</CardTitle>
          <Badge variant="outline" className="text-xs">
            Online
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 bg-foreground/40 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Quick Replies */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map((reply) => (
                  <Button
                    key={reply.action}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleQuickReply(reply)}
                  >
                    {reply.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by AI • LogiVox Assistant
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
