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
  Sparkles,
  User,
  Loader2,
  Brain,
  FileText,
  Lightbulb,
  MessageCircleQuestion,
  Compass,
  Puzzle,
  BookOpen,
  ChevronDown,
  AlertCircle,
  Target,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  HardDrive,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConversationStore, useSettingsStore } from '@/lib/stores';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  enhancedTutor,
  type GroundedResponse,
  type FlashcardSuggestion,
} from '@/lib/enhanced-tutor';
import { documentManager, formatCitation, type Citation } from '@/lib/document-processor';
import { localDB, type LocalDocument } from '@/lib/local-storage';
import type { Message } from '@/lib/types';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

type TutorMode = 'socratic' | 'guidance' | 'direct' | 'problem_breakdown';
type ConfidenceLevel = 'high' | 'medium' | 'low';

const TUTOR_MODES = [
  { id: 'socratic' as TutorMode, name: 'Socratic', icon: MessageCircleQuestion, desc: 'Discover through questions' },
  { id: 'guidance' as TutorMode, name: 'Guided', icon: Compass, desc: 'Hints and guidance' },
  { id: 'direct' as TutorMode, name: 'Direct', icon: BookOpen, desc: 'Clear explanations' },
  { id: 'problem_breakdown' as TutorMode, name: 'Solver', icon: Puzzle, desc: 'Step-by-step breakdown' },
];

// Citation display component
function CitationBadge({ citation, onClick }: { citation: Citation; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors"
    >
      <FileText className="h-3 w-3" />
      {formatCitation(citation)}
    </button>
  );
}

// Self-explanation prompt component
function SelfExplanationPrompt({
  prompt,
  onSubmit,
  onCancel,
}: {
  prompt: string;
  onSubmit: (explanation: string) => void;
  onCancel: () => void;
}) {
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!explanation.trim()) {
      toast.error('Please enter your explanation');
      return;
    }
    setIsSubmitting(true);
    await onSubmit(explanation);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 rounded-lg border border-primary/30 bg-primary/5"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium mb-2">{prompt}</p>
          <Textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explain it in your own words..."
            className="min-h-[80px] bg-background"
            disabled={isSubmitting}
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Submit
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Skip
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Self-explanation feedback component
function ExplanationFeedback({
  result,
}: {
  result: {
    score: number;
    feedback: string;
    missing: string[];
    accurate: string[];
    misconceptions: string[];
  };
}) {
  const scorePercent = Math.round(result.score * 100);
  const isGood = result.score >= 0.7;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4 p-4 rounded-lg border"
    >
      <div className="flex items-center gap-4 mb-3">
        <div className={cn(
          "flex items-center justify-center h-12 w-12 rounded-full",
          isGood ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
        )}>
          {isGood ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
        </div>
        <div>
          <p className="font-medium">
            {isGood ? "Great explanation!" : "Good effort! Here's how to improve:"}
          </p>
          <p className="text-sm text-muted-foreground">Score: {scorePercent}%</p>
        </div>
      </div>

      <p className="text-sm mb-3">{result.feedback}</p>

      {result.accurate.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-green-600 mb-1">Accurate points:</p>
          <div className="flex flex-wrap gap-1">
            {result.accurate.map((point, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-green-500/10 text-green-600">
                {point}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result.missing.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-amber-600 mb-1">Consider adding:</p>
          <div className="flex flex-wrap gap-1">
            {result.missing.slice(0, 3).map((point, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-amber-500/10 text-amber-600">
                {point}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result.misconceptions.length > 0 && (
        <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-medium text-red-600 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Misconception Alert
          </p>
          <p className="text-xs text-red-600 mt-1">{result.misconceptions[0]}</p>
        </div>
      )}
    </motion.div>
  );
}

// Offline/Online indicator
function ConnectionStatus({ isOffline }: { isOffline: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
      isOffline ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"
    )}>
      {isOffline ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
      {isOffline ? 'Offline' : 'Online'}
    </div>
  );
}

// Main Enhanced Chat Component
export function EnhancedTutorChat() {
  const { activeConversationId, messages, addMessage, updateMessage } = useConversationStore();
  const { preferences, setPreferences } = useSettingsStore();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tutorMode, setTutorMode] = useState<TutorMode>('socratic');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium');
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(true);
  const [activeSelfExplanation, setActiveSelfExplanation] = useState<string | null>(null);
  const [explanationFeedback, setExplanationFeedback] = useState<any>(null);
  const [flashcardSuggestions, setFlashcardSuggestions] = useState<FlashcardSuggestion[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversationMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  // Load documents on mount
  useEffect(() => {
    const loadDocs = async () => {
      const docs = await localDB.getAllDocuments();
      setDocuments(docs);
    };
    loadDocs();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages.length]);

  // Handle self-explanation submission
  const handleSelfExplanation = useCallback(async (explanation: string) => {
    if (!activeSelfExplanation) return;

    const result = await enhancedTutor.evaluateSelfExplanation(
      explanation,
      activeSelfExplanation,
      '' // Would pass actual context
    );

    setExplanationFeedback(result);
    setActiveSelfExplanation(null);
  }, [activeSelfExplanation]);

  // Generate flashcards from current context
  const handleGenerateFlashcards = useCallback(async () => {
    if (selectedDocumentIds.length === 0) {
      toast.info('Select a document first to generate flashcards');
      return;
    }

    toast.info('Generating flashcards...');

    const suggestions = await enhancedTutor.generateFlashcardsFromDocument(
      selectedDocumentIds[0]
    );

    setFlashcardSuggestions(suggestions);
    toast.success(`Generated ${suggestions.length} flashcard suggestions!`);
  }, [selectedDocumentIds]);

  // Main submit handler
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setInput('');

    // Create user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: activeConversationId || 'new',
      user_id: '',
      role: 'user',
      content: userContent,
      citations: [],
      provider: isOfflineMode ? 'local' : preferences.defaultProvider,
      model: preferences.defaultModel,
      tokens_used: 0,
      metadata: {},
      parent_message_id: null,
      created_at: new Date().toISOString(),
    };

    addMessage(activeConversationId || 'new', userMessage);
    setIsLoading(true);

    try {
      // Get response with citations from local RAG
      const response: GroundedResponse = await enhancedTutor.answerWithCitations(
        userContent,
        {
          documentIds: selectedDocumentIds,
          conversationHistory: conversationMessages.slice(-5).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          studentState: {
            confidence,
            learningStyle: 'reading',
            knowledgeLevel: 'intermediate',
            attentionSpan: 'medium',
            struggling: false,
            questionHistory: [],
            misconceptions: [],
          },
          mode: tutorMode,
        }
      );

      // Create assistant message with citations
      const assistantMessage: Message & {
        selfExplanationPrompt?: string;
        followUpQuestions?: string[];
        detectedGaps?: typeof response.detectedGaps;
      } = {
        id: crypto.randomUUID(),
        conversation_id: activeConversationId || 'new',
        user_id: '',
        role: 'assistant',
        content: '',
        citations: response.citations,
        provider: isOfflineMode ? 'local' : preferences.defaultProvider,
        model: preferences.defaultModel,
        tokens_used: 0,
        metadata: {},
        parent_message_id: null,
        created_at: new Date().toISOString(),
        selfExplanationPrompt: response.selfExplanationPrompt,
        followUpQuestions: response.followUpQuestions,
        detectedGaps: response.detectedGaps,
      };

      addMessage(activeConversationId || 'new', assistantMessage);

      // Stream response
      let currentContent = '';
      const words = response.content.split(' ');

      for (const word of words) {
        currentContent += (currentContent ? ' ' : '') + word;
        useConversationStore.getState().updateMessage(
          activeConversationId || 'new',
          assistantMessage.id,
          { content: currentContent }
        );
        await new Promise(r => setTimeout(r, 10));
      }

      // Show self-explanation prompt after message
      if (response.selfExplanationPrompt && tutorMode !== 'direct') {
        setTimeout(() => {
          setActiveSelfExplanation(userContent);
        }, 1000);
      }

    } catch (error) {
      console.error('Error getting response:', error);
      toast.error('Failed to get response. Try switching to offline mode.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && preferences.sendOnEnter) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="border-b border-border bg-card/95 backdrop-blur-xl p-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Mode selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {(() => {
                    const mode = TUTOR_MODES.find(m => m.id === tutorMode);
                    return mode && <mode.icon className="h-4 w-4" />;
                  })()}
                  <span className="hidden sm:inline">{TUTOR_MODES.find(m => m.id === tutorMode)?.name}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {TUTOR_MODES.map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => setTutorMode(m.id)}
                    className={cn("flex flex-col items-start gap-1 p-3", tutorMode === m.id && "bg-muted")}
                  >
                    <div className="flex items-center gap-2">
                      <m.icon className="h-4 w-4" />
                      <span className="font-medium">{m.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground pl-6">{m.desc}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Confidence */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Level:</span>
              <div className="flex gap-1">
                {(['low', 'medium', 'high'] as ConfidenceLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className={cn(
                      "w-6 h-2 rounded-full transition-all",
                      level === 'low' ? "bg-red-500" : level === 'medium' ? "bg-yellow-500" : "bg-green-500",
                      confidence === level ? "ring-2 ring-offset-1 ring-ring" : "opacity-30"
                    )}
                    title={level}
                  />
                ))}
              </div>
            </div>

            {/* Offline mode toggle */}
            <ConnectionStatus isOffline={isOfflineMode} />
          </div>

          {/* Document indicator */}
          {selectedDocumentIds.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              {selectedDocumentIds.length} document{selectedDocumentIds.length !== 1 ? 's' : ''} selected
            </Badge>
          )}
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto">
          {conversationMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
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
                <div>
                  <h1 className="text-2xl font-bold mb-2">AI Tutor</h1>
                  <p className="text-muted-foreground max-w-md">
                    Your personal, private AI tutor. Upload documents and ask questions.
                    All processing happens locally on your device.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                    <CardContent className="py-6 text-center">
                      <HardDrive className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">100% Local</p>
                      <p className="text-xs text-muted-foreground">No data leaves your device</p>
                    </CardContent>
                  </Card>
                  <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors">
                    <CardContent className="py-6 text-center">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">RAG Powered</p>
                      <p className="text-xs text-muted-foreground">Citations from your docs</p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversationMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "group py-6 px-4 md:px-8",
                    message.role === 'user' && "bg-muted/30"
                  )}
                >
                  <div className="flex gap-4">
                    <Avatar className={cn(
                      "h-8 w-8 shrink-0",
                      message.role === 'user' ? "bg-primary" : "bg-gradient-to-br from-primary to-chart-2"
                    )}>
                      <AvatarFallback className={cn(
                        message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-transparent"
                      )}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-white" />
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {message.role === 'user' ? 'You' : 'AI Tutor'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                        {message.provider === 'local' && (
                          <Badge variant="outline" className="text-xs">
                            <HardDrive className="h-3 w-3 mr-1" />
                            Local
                          </Badge>
                        )}
                      </div>

                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeHighlight]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {/* Citations */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-muted-foreground">Sources:</span>
                          {(message.citations as Citation[]).map((citation, i) => (
                            <CitationBadge key={i} citation={citation} />
                          ))}
                        </div>
                      )}

                      {/* Follow-up questions */}
                      {(message as any).followUpQuestions && (message as any).followUpQuestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(message as any).followUpQuestions.map((q: string, i: number) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              onClick={() => setInput(q)}
                              className="text-xs"
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 py-4 px-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Self-explanation area */}
      {activeSelfExplanation && (
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <SelfExplanationPrompt
              prompt="Now try explaining this concept back in your own words. This helps solidify your understanding."
              onSubmit={handleSelfExplanation}
              onCancel={() => setActiveSelfExplanation(null)}
            />
          </div>
        </div>
      )}

      {/* Explanation feedback */}
      {explanationFeedback && (
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <ExplanationFeedback result={explanationFeedback} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExplanationFeedback(null)}
              className="mt-2"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-card/95 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-muted/50 p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tutorMode === 'socratic'
                ? "Ask anything - I'll guide you to discover the answer..."
                : "Ask a question about your documents..."
              }
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
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted"
                onClick={handleGenerateFlashcards}
              >
                Generate Flashcards
              </Badge>
              <Badge
                variant="outline"
                className="text-xs cursor-pointer hover:bg-muted"
                onClick={() => setIsOfflineMode(!isOfflineMode)}
              >
                {isOfflineMode ? <HardDrive className="h-3 w-3 mr-1" /> : <Wifi className="h-3 w-3 mr-1" />}
                {isOfflineMode ? 'Local Mode' : 'Cloud Mode'}
              </Badge>
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
