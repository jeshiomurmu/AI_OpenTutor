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
  Lightbulb,
  Target,
  Compass,
  Zap,
  Eye,
  HelpCircle,
  MessageCircleQuestion,
  TrendingUp,
  Puzzle,
  Shield,
  Stethoscope,
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SocraticTutorEngine,
  ProblemBreakdownEngine,
  AdaptiveExplanationGenerator,
  KnowledgeGapDetector,
  detectMisconceptions,
  type StudentState,
  type TutorModeConfig,
  type ProblemBreakdown,
  type KnowledgeGap,
} from '@/lib/ai/tutor-intelligence';
import type { Message, Citation } from '@/lib/types';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

type TutorMode = 'socratic' | 'guidance' | 'direct' | 'problem_breakdown';
type ConfidenceLevel = 'high' | 'medium' | 'low';

interface TutorSession {
  mode: TutorMode;
  confidence: ConfidenceLevel;
  conceptsLearned: string[];
  gapsDetected: KnowledgeGap[];
  misconceptionsIdentified: string[];
  questionsAsked: number;
  correctResponses: number;
}

const TUTOR_MODES: Array<{ id: TutorMode; name: string; icon: React.ElementType; description: string }> = [
  { id: 'socratic', name: 'Socratic Mode', icon: MessageCircleQuestion, description: 'I ask guiding questions to help you discover answers yourself' },
  { id: 'guidance', name: 'Guided Learning', icon: Compass, description: 'I provide hints and partial explanations to guide your thinking' },
  { id: 'direct', name: 'Direct Teaching', icon: BookOpen, description: 'I explain concepts clearly with examples and analogies' },
  { id: 'problem_breakdown', name: 'Problem Solver', icon: Puzzle, description: 'I break complex problems into manageable steps' },
];

function TutorModeSelector({ mode, onModeChange }: { mode: TutorMode; onModeChange: (mode: TutorMode) => void }) {
  const currentMode = TUTOR_MODES.find(m => m.id === mode);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {currentMode && <currentMode.icon className="h-4 w-4" />}
          <span className="hidden sm:inline">{currentMode?.name}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {TUTOR_MODES.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={cn("flex flex-col items-start gap-1 p-3", mode === m.id && "bg-muted")}
          >
            <div className="flex items-center gap-2">
              <m.icon className="h-4 w-4" />
              <span className="font-medium">{m.name}</span>
            </div>
            <span className="text-xs text-muted-foreground pl-6">{m.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConfidenceIndicator({ confidence, onConfidenceChange }: {
  confidence: ConfidenceLevel;
  onConfidenceChange: (level: ConfidenceLevel) => void;
}) {
  const colors = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Confidence:</span>
      <div className="flex gap-1">
        {(['low', 'medium', 'high'] as ConfidenceLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => onConfidenceChange(level)}
            className={cn(
              "w-6 h-2 rounded-full transition-all",
              colors[level],
              confidence === level ? "ring-2 ring-offset-1 ring-ring" : "opacity-30"
            )}
            title={`Confidence: ${level}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground capitalize">{confidence}</span>
    </div>
  );
}

function ProblemBreakdownView({ breakdown }: { breakdown: ProblemBreakdown }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Puzzle className="h-4 w-4 text-primary" />
          Problem Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            {breakdown.steps.length} steps
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            ~{breakdown.estimatedTime} min
          </span>
        </div>

        {breakdown.steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <button
              onClick={() => setExpandedStep(expandedStep === index ? null : index)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all",
                expandedStep === index
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium shrink-0",
                  step.type === 'knowledge' ? "bg-blue-500/20 text-blue-600" :
                  step.type === 'calculation' ? "bg-green-500/20 text-green-600" :
                  step.type === 'reasoning' ? "bg-purple-500/20 text-purple-600" :
                  "bg-orange-500/20 text-orange-600"
                )}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.description}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{step.type}</Badge>
                    <Badge variant="outline" className="text-xs">Difficulty: {step.difficulty}/3</Badge>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedStep === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      {step.hints.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" /> Hints
                          </p>
                          <ul className="text-xs space-y-1">
                            {step.hints.map((hint, i) => (
                              <li key={i} className="text-muted-foreground pl-4 border-l-2 border-border ml-1">{hint}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {step.misconceptions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-amber-500 mb-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Watch out for
                          </p>
                          <ul className="text-xs space-y-1">
                            {step.misconceptions.map((m, i) => (
                              <li key={i} className="text-amber-600/80 pl-4 border-l-2 border-amber-500/30 ml-1">{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <HelpCircle className="h-3 w-3 text-primary" />
                        <span className="text-xs italic">Self-check: {step.selfCheckQuestion}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function KnowledgeGapCard({ gap, onAddress }: { gap: KnowledgeGap; onAddress?: () => void }) {
  const colors = {
    missing: 'bg-red-500',
    weak: 'bg-yellow-500',
    misunderstood: 'bg-purple-500',
    forgotten: 'bg-blue-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 rounded-lg border border-border bg-card"
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-2 h-2 rounded-full mt-1.5", colors[gap.gapType])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{gap.conceptName}</span>
            <Badge variant="outline" className="text-xs capitalize">{gap.gapType}</Badge>
          </div>
          {gap.blockingConcepts.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Blocking: {gap.blockingConcepts.join(', ')}
            </p>
          )}
          <Progress value={gap.severity * 100} className="h-1 mt-2" />
        </div>
        <Button size="sm" variant="outline" onClick={onAddress}>
          Address
        </Button>
      </div>
    </motion.div>
  );
}

function MisconceptionAlert({ misconception }: { misconception: { misconception: string; detection: string; correction: string } }) {
  const [showCorrection, setShowCorrection] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/10"
    >
      <div className="flex items-start gap-3">
        <Stethoscope className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm text-amber-600 mb-1">Potential misconception detected</p>
          <p className="text-xs text-muted-foreground mb-2">{misconception.misconception}</p>
          <button
            onClick={() => setShowCorrection(!showCorrection)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {showCorrection ? 'Hide correction' : 'Show correction'}
            <ChevronDown className={cn("h-3 w-3 transition-transform", showCorrection && "rotate-180")} />
          </button>
          {showCorrection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-2 p-2 rounded bg-background text-sm"
            >
              {misconception.correction}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function generateSocraticResponse(question: string, context: string, confidence: ConfidenceLevel, mode: TutorMode): string {
  const isDirectQuestion = /what is|define|explain|tell me/i.test(question);
  const isConfused = /don't understand|confused|lost|doesn't make sense/i.test(question);

  if (mode === 'socratic') {
    if (isDirectQuestion) {
      const guidingQuestions = [
        "Before I tell you directly, let me ask - what do you already know about this topic?",
        "Great question! What's your initial understanding of this concept?",
        "Let's explore this together. What aspects are you most curious about?",
        "I could give you the answer, but I think you'll learn more if we discover it. What's your first instinct?",
      ];
      const followUpHints = {
        high: "You seem confident. Think about the underlying principles at work here.",
        medium: "Take a moment to consider what you already know about similar concepts.",
        low: "Let's start simple. Can you think of any real-world examples of this?",
      };
      return `${guidingQuestions[Math.floor(Math.random() * guidingQuestions.length)]}\n\n${followUpHints[confidence]}`;
    }

    if (isConfused) {
      return "I can see you're working through this. Let me help you get unstuck.\n\nFirst, let's identify where the confusion lies. Can you tell me specifically what part doesn't make sense? Sometimes articulating the confusion helps us see the path forward.\n\nMeanwhile, let's try approaching this from a different angle: What would you expect to happen instead?";
    }

    return "You're on the right track thinking about this. Let me ask you this: What's the relationship between what you're asking and what you already know? Can you make any connections?";
  }

  return "";
}

function generateProblemBreakdownResponse(question: string): { breakdown: ProblemBreakdown; response: string } | null {
  if (/prove|show that|calculate|find|solve|determine/i.test(question)) {
    const engine = new ProblemBreakdownEngine();
    const breakdown = engine.breakdown(question, 'intermediate');
    return {
      breakdown,
      response: `I've broken this problem down into ${breakdown.steps.length} manageable steps to help you work through it systematically. Each step includes hints and common misconceptions to watch out for.\n\nDon't try to solve everything at once - focus on one step at a time. Click on each step to see hints and self-check questions.\n\nReady to start? Let's begin with understanding what we need to do.`,
    };
  }
  return null;
}

export function AITutorChat() {
  const { activeConversationId, messages, addMessage, setMessages } = useConversationStore();
  const { preferences } = useSettingsStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tutorMode, setTutorMode] = useState<TutorMode>('socratic');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium');
  const [documentContext, setDocumentContext] = useState('');
  const [sessionStats, setSessionStats] = useState<TutorSession>({
    mode: 'socratic',
    confidence: 'medium',
    conceptsLearned: [],
    gapsDetected: [],
    misconceptionsIdentified: [],
    questionsAsked: 0,
    correctResponses: 0,
  });
  const [currentBreakdown, setCurrentBreakdown] = useState<ProblemBreakdown | null>(null);
  const [activeGaps, setActiveGaps] = useState<KnowledgeGap[]>([]);
  const [activeMisconceptions, setActiveMisconceptions] = useState<Array<{ misconception: string; detection: string; correction: string }>>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversationMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages.length]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    setInput('');

    // Check for misconceptions in user's response
    const detectedMisconceptions = detectMisconceptions(userContent, documentContext || 'general', documentContext);
    if (detectedMisconceptions.length > 0) {
      setActiveMisconceptions(prev => [...prev, ...detectedMisconceptions]);
    }

    // Create user message
    const userMessage: Message & { problemBreakdown?: ProblemBreakdown } = {
      id: crypto.randomUUID(),
      conversation_id: activeConversationId || 'new',
      user_id: '',
      role: 'user',
      content: userContent,
      citations: [],
      provider: preferences.defaultProvider,
      model: preferences.defaultModel,
      tokens_used: 0,
      metadata: {},
      parent_message_id: null,
      created_at: new Date().toISOString(),
    };

    addMessage(activeConversationId || 'new', userMessage);
    setIsLoading(true);

    // Generate AI response based on mode
    let aiContent = '';

    if (tutorMode === 'socratic' || tutorMode === 'guidance') {
      aiContent = generateSocraticResponse(userContent, documentContext, confidence, tutorMode);
    } else if (tutorMode === 'problem_breakdown') {
      const breakdownResult = generateProblemBreakdownResponse(userContent);
      if (breakdownResult) {
        setCurrentBreakdown(breakdownResult.breakdown);
        aiContent = breakdownResult.response;
      } else {
        aiContent = "I can help break down this problem! To get the most out of problem breakdown mode, try asking me to solve, calculate, prove, or find something specific. For example:\n\n• \"How do I prove that...\"\n• \"Calculate the...\"\n• \"Find the value of...\"\n\nWhat problem would you like me to break down?";
      }
    } else {
      // Direct teaching mode
      aiContent = await generateDirectTeachingResponse(userContent, documentContext);
    }

    // Simulate streaming
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: activeConversationId || 'new',
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
    };

    addMessage(activeConversationId || 'new', assistantMessage);

    let currentContent = '';
    for (const chunk of aiContent.split(' ')) {
      currentContent += chunk + ' ';
      useConversationStore.getState().updateMessage(
        activeConversationId || 'new',
        assistantMessage.id,
        { content: currentContent }
      );
      await new Promise(r => setTimeout(r, 15));
    }

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      questionsAsked: prev.questionsAsked + 1,
    }));

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && preferences.sendOnEnter) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tutor Controls */}
      <div className="border-b border-border bg-card/95 backdrop-blur-xl p-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TutorModeSelector mode={tutorMode} onModeChange={setTutorMode} />
          <ConfidenceIndicator confidence={confidence} onConfidenceChange={setConfidence} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="max-w-3xl mx-auto">
              {conversationMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
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
                        I learn how you learn. I ask guiding questions, break down complex problems, and adapt to your understanding.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <button
                        onClick={() => setTutorMode('socratic')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border transition-colors text-left"
                      >
                        <MessageCircleQuestion className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Socratic Mode</p>
                          <p className="text-xs text-muted-foreground">Discover answers through questions</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setTutorMode('problem_breakdown')}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted border border-border transition-colors text-left"
                      >
                        <Puzzle className="h-5 w-5 text-chart-2" />
                        <div>
                          <p className="font-medium text-sm">Problem Solving</p>
                          <p className="text-xs text-muted-foreground">Step-by-step breakdown</p>
                        </div>
                      </button>
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
                        "group flex gap-4 py-6 px-4 md:px-8",
                        message.role === 'user' && "bg-muted/30"
                      )}
                    >
                      <div className="shrink-0">
                        <Avatar className={cn("h-8 w-8", message.role === 'user' ? "bg-primary" : "bg-gradient-to-br from-primary to-chart-2")}>
                          <AvatarFallback className={cn(message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-transparent")}>
                            {message.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-white" />}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{message.role === 'user' ? 'You' : 'AI Tutor'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="message-content prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex, rehypeHighlight]}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 py-4 px-4 md:px-8 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Misconception Alerts */}
          <AnimatePresence>
            {activeMisconceptions.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border p-4"
              >
                <div className="max-w-3xl mx-auto space-y-2">
                  {activeMisconceptions.slice(0, 2).map((m, i) => (
                    <MisconceptionAlert key={i} misconception={m} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Problem Breakdown Panel */}
          <AnimatePresence>
            {currentBreakdown && tutorMode === 'problem_breakdown' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border p-4 overflow-y-auto max-h-[40vh]"
              >
                <div className="max-w-3xl mx-auto">
                  <ProblemBreakdownView breakdown={currentBreakdown} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Knowledge Gap Panel */}
          <AnimatePresence>
            {activeGaps.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border p-4"
              >
                <div className="max-w-3xl mx-auto space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Knowledge Gaps Detected</span>
                  </div>
                  {activeGaps.slice(0, 3).map((gap, i) => (
                    <KnowledgeGapCard
                      key={i}
                      gap={gap}
                      onAddress={() => {
                        setInput(`Help me understand ${gap.conceptName}`);
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="border-t border-border bg-card/95 backdrop-blur-xl">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
              <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-muted/50 p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={tutorMode === 'socratic'
                    ? "Ask me anything and I'll help you discover the answer..."
                    : tutorMode === 'problem_breakdown'
                    ? "Describe the problem you want to solve..."
                    : "Ask a question..."
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
                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted"
                    onClick={() => setInput(prev => prev + "\n\n[Explain step by step] ")}
                  >
                    Step by Step
                  </Badge>
                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted"
                    onClick={() => setInput(prev => prev + "\n\n[Give me a hint] ")}
                  >
                    Need a Hint
                  </Badge>
                  <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted"
                    onClick={() => setInput(prev => prev + "\n\n[Check my understanding] ")}
                  >
                    Check Understanding
                  </Badge>
                </div>
                <span>
                  {preferences.sendOnEnter ? 'Enter to send' : 'Shift+Enter for new line'}
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Session Sidebar - Knowledge Tracking */}
        <div className="hidden lg:block w-72 border-l border-border bg-card/50 p-4 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Session Progress
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Questions Asked</span>
                  <span className="font-medium">{sessionStats.questionsAsked}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Correct Responses</span>
                  <span className="font-medium">{sessionStats.correctResponses}</span>
                </div>
              </div>
            </div>

            {sessionStats.conceptsLearned.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  Concepts Explored
                </h3>
                <div className="flex flex-wrap gap-1">
                  {sessionStats.conceptsLearned.map((concept, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{concept}</Badge>
                  ))}
                </div>
              </div>
            )}

            {activeGaps.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-500" />
                  Knowledge Gaps
                </h3>
                <div className="space-y-2">
                  {activeGaps.slice(0, 4).map((gap, i) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      • {gap.conceptName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Learning Tips
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Try the <strong>Socratic mode</strong> to discover answers through guided questions.</p>
                <p>Use <strong>Problem Breakdown</strong> mode for complex problems.</p>
                <p>Adjust your <strong>confidence level</strong> to get appropriate amounts of guidance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function generateDirectTeachingResponse(question: string, context: string): Promise<string> {
  // Simulate direct teaching response
  await new Promise(r => setTimeout(r, 100));

  return `Let me explain this concept for you.\n\n## Key Points\n\n1. **Understanding the basics**: This concept is foundational to many others.\n\n2. **How it works**: The mechanism involves several interconnected processes.\n\n3. **Why it matters**: This concept explains many phenomena you'll encounter.\n\n## Example\n\nConsider this practical example: If we apply this concept to a real-world scenario, we can see how it directly affects the outcome.\n\n---\n\nWould you like me to go deeper into any of these points, or shall we explore with some practice questions?`;
}
