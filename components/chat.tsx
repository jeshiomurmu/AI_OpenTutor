"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import {
  Send,
  RotateCcw,
  Copy,
  Check,
  Sparkles,
  User,
  Bot,
  MoreHorizontal,
  Trash2,
  Edit2,
  ChevronDown,
  FileText,
  BookOpen,
  GraduationCap,
  Brain,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConversationStore, useSettingsStore, useUIStore } from '@/lib/stores';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Message, Citation } from '@/lib/types';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

function MessageContent({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <div className="message-content prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className={cn("block bg-muted p-4 rounded-lg overflow-x-auto", className)} {...props}>
                {children}
              </code>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
      )}
    </div>
  );
}

function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer">
      <div className="flex items-start gap-2">
        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{citation.document_title}</div>
          {citation.page_number && (
            <div className="text-xs text-muted-foreground">Page {citation.page_number}</div>
          )}
          <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{citation.text}</div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const { deleteMessage, updateMessage } = useConversationStore();
  const isUser = message.role === 'user';
  const isStreaming = Boolean((message as Record<string, unknown>).isStreaming);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id);

      if (error) throw error;
      // We need the conversation ID
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleRegenerate = async () => {
    toast.info('Regenerating response...');
    // This would trigger a re-generation
  };

  const citations = (message.citations as unknown as Citation[] | undefined) || undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group flex gap-4 py-6 px-4 md:px-8",
        isUser && "bg-muted/30"
      )}
    >
      <div className="shrink-0">
        <Avatar className={cn("h-8 w-8", isUser ? "bg-primary" : "bg-gradient-to-br from-primary to-chart-2")}>
          <AvatarFallback className={cn(isUser ? "bg-primary text-primary-foreground" : "bg-transparent")}>
            {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-white" />}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{isUser ? 'You' : 'AI Tutor'}</span>
          {!isUser && message.model && (
            <Badge variant="secondary" className="text-xs">{message.model}</Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
        </div>

        <MessageContent content={message.content} isStreaming={isStreaming} />

        {citations && citations.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Sources ({citations.length})
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {citations.slice(0, 4).map((citation, i) => (
                <CitationCard key={citation.chunk_id || i} citation={citation} />
              ))}
            </div>
          </div>
        )}

        <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity", isStreaming && "hidden")}>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-2">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          {!isUser && (
            <Button variant="ghost" size="sm" onClick={handleRegenerate} className="h-8 px-2">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </DropdownMenuItem>
              {isUser && (
                <DropdownMenuItem>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  const { openUploadModal } = useUIStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-lg text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">How can I help you learn today?</h1>
          <p className="text-muted-foreground">
            Upload a document or ask a question. I'll help you understand, memorize, and master any topic.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <button
            onClick={openUploadModal}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border transition-colors"
          >
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Upload Document</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border transition-colors">
            <BookOpen className="h-5 w-5 text-chart-2" />
            <span className="text-sm font-medium">Review Flashcards</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border transition-colors">
            <GraduationCap className="h-5 w-5 text-chart-3" />
            <span className="text-sm font-medium">Take Quiz</span>
          </button>
        </div>

        <div className="pt-4 text-sm text-muted-foreground">
          <p>Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {[
              "Explain quantum computing simply",
              "Create a study plan for biology",
              "What are the key concepts in calculus?",
              "Generate flashcards for this chapter",
            ].map((prompt) => (
              <span key={prompt} className="px-3 py-1 rounded-full bg-muted/50 text-xs">
                {prompt}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Chat() {
  const { activeConversationId, messages, addMessage, setMessages } = useConversationStore();
  const { preferences } = useSettingsStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversationMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(activeConversationId, data);
      }
    };

    fetchMessages();
  }, [activeConversationId, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages.length]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activeConversationId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: activeConversationId,
      user_id: '',
      role: 'user',
      content: input.trim(),
      citations: [],
      provider: preferences.defaultProvider,
      model: preferences.defaultModel,
      tokens_used: 0,
      metadata: {},
      parent_message_id: null,
      created_at: new Date().toISOString(),
    };

    setInput('');
    addMessage(activeConversationId, userMessage);
    setIsLoading(true);

    try {
      // Save user message
      const { error: userError } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          role: 'user',
          content: userMessage.content,
          provider: preferences.defaultProvider,
          model: preferences.defaultModel,
        });

      if (userError) throw userError;

      // Simulated AI response for now
      const assistantMessage: Message & { isStreaming?: boolean } = {
        id: crypto.randomUUID(),
        conversation_id: activeConversationId,
        user_id: '',
        role: 'assistant',
        content: '',
        citations: [],
        provider: preferences.defaultProvider,
        model: preferences.defaultModel,
        tokens_used: 0,
        metadata: {},
        parent_message_id: null,
        created_at: new Date().toISOString(),
        isStreaming: true,
      };

      addMessage(activeConversationId, assistantMessage);

      // Simulate streaming response
      const response = generateMockResponse(userMessage.content);
      let currentContent = '';

      for (const chunk of response) {
        currentContent += chunk;
        useConversationStore.getState().updateMessage(
          activeConversationId,
          assistantMessage.id,
          { content: currentContent }
        );
        await new Promise((r) => setTimeout(r, 20));
      }

      useConversationStore.getState().updateMessage(
        activeConversationId,
        assistantMessage.id,
        { content: currentContent }
      );

      // Save assistant message
      await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          role: 'assistant',
          content: currentContent,
          provider: preferences.defaultProvider,
          model: preferences.defaultModel,
        });

    } catch {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (preferences.sendOnEnter) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  if (!activeConversationId) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-[var(--chat-width)] mx-auto">
          {conversationMessages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border">
              {conversationMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
          {isLoading && conversationMessages.length > 0 && (
            <div className="flex items-center gap-2 py-4 px-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="max-w-[var(--chat-width)] mx-auto p-4">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-muted/50 p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your documents..."
              className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[40px] max-h-[200px] p-2"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 shrink-0 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="hover:text-foreground transition-colors"
                onClick={() => {
                  setInput(prev => prev + `\n\n[Flashcards] Generate flashcards from this topic.`);
                }}
              >
                <Badge variant="outline" className="text-xs">Flashcards</Badge>
              </button>
              <button
                type="button"
                className="hover:text-foreground transition-colors"
                onClick={() => {
                  setInput(prev => prev + `\n\n[Quiz] Create a quiz about this topic.`);
                }}
              >
                <Badge variant="outline" className="text-xs">Quiz</Badge>
              </button>
              <button
                type="button"
                className="hover:text-foreground transition-colors"
                onClick={() => {
                  setInput(prev => prev + `\n\n[Summary] Summarize this topic.`);
                }}
              >
                <Badge variant="outline" className="text-xs">Summary</Badge>
              </button>
            </div>
            <span>
              {preferences.sendOnEnter ? 'Enter to send' : 'Shift+Enter for new line'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

function generateMockResponse(input: string): string[] {
  const responses: Record<string, string> = {
    default: `I'd be happy to help you with that! Let me explain this concept step by step.

## Understanding the Topic

This is a fascinating area of study that combines multiple concepts. Here's what you need to know:

1. **Foundation**: The basic principles are built on fundamental theories that have been developed over decades.

2. **Key Concepts**: There are several important ideas to understand:
   - First, we have the primary mechanism
   - Second, the interaction between components
   - Third, the practical applications

3. **Practical Example**:

\`\`\`
// Example code
function learn(concept) {
  return understand(concept)
    .then(practice)
    .then(master);
}
\`\`\`

## Mathematical Foundation

The mathematical formula for this is:

$$E = mc^2$$

This equation shows the relationship between energy and mass.

## Next Steps

Would you like me to:
- Generate flashcards for this topic?
- Create a quiz to test your understanding?
- Provide more detailed examples?
`,
    flashcards: `I'll generate flashcards for you! Here are 5 key flashcards:

---

**Flashcard 1**
- **Q**: What is the primary concept?
- **A**: The primary concept is the foundational principle that underlies the entire topic.

---

**Flashcard 2**
- **Q**: Define the key mechanism.
- **A**: The key mechanism is the process by which components interact to produce outcomes.

---

**Flashcard 3**
- **Q**: What is the formula for the relationship?
- **A**: $E = mc^2$, which demonstrates the equivalence of mass and energy.

---

**Flashcard 4**
- **Q**: List the three main components.
- **A**: 1. Foundation
2. Key Mechanism
3. Practical Applications

---

**Flashcard 5**
- **Q**: What are the practical uses?
- **A**: The practical applications include engineering, research, and everyday problem-solving.

---

Would you like me to save these flashcards to your deck for review?`,
    quiz: `Here's a quiz to test your understanding:

**Question 1** (Multiple Choice)

What is the primary factor that determines the outcome?
- A) Temperature
- B) Pressure
- C) Time
- D) All of the above

**Answer**: D) All of the above. The outcome is determined by the combined effect of temperature, pressure, and time.

---

**Question 2** (True/False)

The theoretical framework only applies to certain conditions.

**Answer**: False. The theoretical framework is universally applicable across all conditions within the defined parameters.

---

**Question 3** (Short Answer)

Explain the relationship between the two main variables.

**Answer**: The two main variables have a direct proportional relationship, meaning as one increases, the other increases proportionally according to the formula $y = kx$, where $k$ is the constant of proportionality.

---

How did you do? Would you like more questions or explanations for any of these?`,
  };

  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('flashcard')) {
    return responses.flashcards.split(' ').map(w => w + ' ');
  }
  if (lowerInput.includes('quiz')) {
    return responses.quiz.split(' ').map(w => w + ' ');
  }
  return responses.default.split(' ').map(w => w + ' ');
}
