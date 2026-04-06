"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet, SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';   
import { useAction } from 'convex/react';
import { Bot, Loader2, Send, User } from 'lucide-react';
import React, { useState } from 'react'

type Message = {
    role: "user" | "assistant" | "system";
    content: string;
};

function AIChatSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I'm your MedCare assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Convex Action
    const sendMessage = useAction(api.actions.chat);

    const handleSend = async () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: "user" as const, content: input }];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const history = newMessages.map(m => ({ role: m.role, content: m.content }));

            const response = await sendMessage({
                message: input,
                conversationHistory: history
            });

            if (response) {
                setMessages(prev => [...prev, { role: "assistant", content: response }]);
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            {/* زر فتح الشات - بدون asChild */}
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 z-50 animate-in fade-in zoom-in duration-300"
                size="icon"
            >
                <Bot className="w-8 h-8 text-white" />
            </Button>

            {/* نافذة الشات المنزلقة */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent className="w-400px sm:w-540px flex flex-col border-l border-border bg-background p-0">
                    <SheetHeader className="px-6 py-4 border-b border-border">
                        <SheetTitle className="flex items-center gap-2">
                            <Bot className="w-6 h-6 text-primary" />
                            <span>MedCare AI Assistant</span>
                        </SheetTitle>
                    </SheetHeader>

                    {/* منطقة المحادثة */}
                    <ScrollArea className="flex-1 px-6 py-4">
                        <div className="space-y-4">
                            {messages.map((m, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex gap-3 text-sm",
                                        m.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {m.role !== "user" && (
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                            <Bot className="w-5 h-5" />
                                        </div>
                                    )}
                                    
                                    <div className={cn(
                                        "p-3 rounded-2xl max-w-[80%]",
                                        m.role === "user"
                                            ? "bg-primary text-white rounded-br-none"
                                            : "bg-muted text-foreground rounded-bl-none"
                                    )}>
                                        {m.content}
                                    </div>
                                    
                                    {m.role === "user" && (
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="flex gap-3 text-sm justify-start">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className="bg-muted text-foreground p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Thinking...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* منطقة الإدخال */}
                    <div className="border-t border-border p-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                className="bg-muted border-border focus-visible:ring-primary"
                                disabled={isLoading}
                            />
                            <Button 
                                onClick={handleSend} 
                                disabled={isLoading || !input.trim()}
                                size="icon"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        {/* الأسئلة المقترحة */}
                        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                            {["Check my appointments", "Opening hours?"].map(q => (
                                <Button
                                    key={q}
                                    variant="outline"
                                    size="sm"
                                    className="whitespace-nowrap text-xs h-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => setInput(q)}
                                >
                                    {q}
                                </Button>
                            ))}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}

export default AIChatSidebar