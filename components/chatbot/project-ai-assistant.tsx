"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, Send, X, Loader2 } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ProjectAIAssistantProps {
    projectId: string;
    projectName: string;
}

export function ProjectAIAssistant({ projectId, projectName }: ProjectAIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load chat history
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            loadChatHistory();
        }
    }, [isOpen]);

    const loadChatHistory = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/ai-chat`);
            if (response.ok) {
                const data = await response.json();
                setMessages(
                    data.messages.map((msg: any) => ({
                        role: msg.role,
                        content: msg.content,
                        timestamp: new Date(msg.createdAt),
                    }))
                );
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch(`/api/projects/${projectId}/ai-chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.slice(-10), // Send last 10 messages for context
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get AI response");
            }

            const data = await response.json();
            const assistantMessage: Message = {
                role: "assistant",
                content: data.response,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = {
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#22c55e] hover:bg-[#16a34a] text-white z-50"
                size="icon"
            >
                <Bot className="h-6 w-6" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col dark:bg-gray-900 dark:border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-800 bg-[#22c55e] text-white rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    <div>
                        <h3 className="font-semibold">AI Assistant</h3>
                        <p className="text-xs opacity-90">{projectName}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-white hover:bg-white/20"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">
                            Hi! I'm your AI assistant. Ask me about:
                        </p>
                        <ul className="text-xs mt-2 space-y-1">
                            <li>• Task management and organization</li>
                            <li>• Project planning and priorities</li>
                            <li>• Team collaboration tips</li>
                            <li>• Workflow optimization</li>
                        </ul>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.role === "user"
                                    ? "bg-[#22c55e] text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-foreground"
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
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t dark:border-gray-800">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        size="icon"
                        className="bg-[#22c55e] hover:bg-[#16a34a]"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}
