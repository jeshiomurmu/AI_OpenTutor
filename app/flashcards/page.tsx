"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
  X,
  Star,
  Clock,
  TrendingUp,
  Brain,
  ChevronDown,
  Shuffle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Flashcard } from '@/lib/types';

interface FlashcardData {
  id: string;
  user_id: string;
  document_id: string | null;
  conversation_id: string | null;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  mastery_level: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  isFlipped?: boolean;
  difficultyRating?: 1 | 2 | 3 | 4;
}

const difficultyColors = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500',
};

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [correct, setCorrect] = useState<Set<string>>(new Set());
  const [sessionStats, setSessionStats] = useState({ startTime: Date.now(), reviewed: 0 });

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('next_review_at', { ascending: true })
        .limit(20);

      if (error) throw error;
      if (data && data.length > 0) {
        setFlashcards(data);
      } else {
        // Sample flashcards for demo
        const sampleFlashcards: FlashcardData[] = [
          {
            id: '1',
            user_id: 'demo',
            question: 'What is the primary mechanism of quantum computing?',
            answer: 'Quantum computing uses quantum bits (qubits) which can exist in superposition states, allowing parallel computation of multiple possibilities simultaneously.',
            difficulty: 'medium',
            tags: ['quantum', 'physics', 'computing'],
            mastery_level: 2,
            last_reviewed_at: null,
            next_review_at: null,
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_id: null,
            conversation_id: null,
          },
          {
            id: '2',
            user_id: 'demo',
            question: 'Explain the concept of "entanglement" in quantum mechanics.',
            answer: 'Entanglement is a quantum phenomenon where two or more particles become correlated in such a way that the quantum state of each particle cannot be described independently. Measuring one particle instantly affects the other, regardless of distance.',
            difficulty: 'hard',
            tags: ['quantum', 'physics'],
            mastery_level: 1,
            last_reviewed_at: null,
            next_review_at: null,
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_id: null,
            conversation_id: null,
          },
          {
            id: '3',
            user_id: 'demo',
            question: 'What is the Schrödinger equation used for?',
            answer: 'The Schrödinger equation is the fundamental equation of quantum mechanics that describes how the quantum state of a physical system changes over time. It is used to calculate wave functions and predict the behavior of quantum systems.',
            difficulty: 'medium',
            tags: ['quantum', 'physics', 'math'],
            mastery_level: 0,
            last_reviewed_at: null,
            next_review_at: null,
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_id: null,
            conversation_id: null,
          },
          {
            id: '4',
            user_id: 'demo',
            question: 'Define "superposition" in quantum terms.',
            answer: 'Superposition is the ability of a quantum system to be in multiple states at the same time until it is measured. A qubit can represent both 0 and 1 simultaneously, unlike classical bits which can only be one or the other.',
            difficulty: 'easy',
            tags: ['quantum', 'basics'],
            mastery_level: 3,
            last_reviewed_at: null,
            next_review_at: null,
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_id: null,
            conversation_id: null,
          },
          {
            id: '5',
            user_id: 'demo',
            question: 'What is quantum decoherence?',
            answer: 'Quantum decoherence is the loss of quantum coherence, where a quantum system loses its quantum properties (like superposition) due to interaction with its environment, effectively collapsing it into a classical state.',
            difficulty: 'hard',
            tags: ['quantum', 'physics'],
            mastery_level: 0,
            last_reviewed_at: null,
            next_review_at: null,
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_id: null,
            conversation_id: null,
          },
        ];
        setFlashcards(sampleFlashcards);
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast.error('Failed to load flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = async (rating: 1 | 2 | 3 | 4) => {
    const currentCard = flashcards[currentIndex];
    if (!currentCard) return;

    const isCorrect = rating >= 3;
    reviewed.add(currentCard.id);
    if (isCorrect) {
      correct.add(currentCard.id);
    }
    setReviewed(new Set(reviewed));
    setCorrect(new Set(correct));

    // Update mastery level based on rating
    const newMasteryLevel = Math.min(5, Math.max(0, currentCard.mastery_level + (rating - 2)));

    try {
      await supabase
        .from('flashcards')
        .update({
          mastery_level: newMasteryLevel,
          review_count: currentCard.review_count + 1,
          last_reviewed_at: new Date().toISOString(),
          next_review_at: calculateNextReview(newMasteryLevel),
        })
        .eq('id', currentCard.id);
    } catch (error) {
      console.error('Failed to update flashcard:', error);
    }

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setShowResults(true);
    }
  };

  const calculateNextReview = (masteryLevel: number): string => {
    const intervals = [1, 3, 7, 14, 30, 60]; // Days for each mastery level
    const days = intervals[Math.min(masteryLevel, intervals.length - 1)];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate.toISOString();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowResults(false);
    setReviewed(new Set());
    setCorrect(new Set());
    setSessionStats({ startTime: Date.now(), reviewed: 0 });
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    handleRestart();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              No Flashcards Yet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Create flashcards from your conversations or documents to start studying.
            </p>
            <Link href="/">
              <Button className="w-full">Go to Chat</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((correct.size / reviewed.size) * 100);
    const timeSpent = Math.round((Date.now() - sessionStats.startTime) / 1000 / 60);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Session Complete!</h1>
            <p className="text-muted-foreground">Great work on your review session.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{correct.size}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-500">{reviewed.size - correct.size}</div>
                <div className="text-sm text-muted-foreground">Needs Review</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{percentage}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Review Again
            </Button>
            <Button onClick={handleShuffle}>
              <Shuffle className="mr-2 h-4 w-4" />
              Shuffle & Restart
            </Button>
          </div>

          <Link href="/" className="block text-center">
            <Button variant="ghost">Back to Home</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {currentIndex + 1} / {flashcards.length}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleShuffle}>
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        <div className="perspective-1000">
          <motion.div
            onClick={handleFlip}
            className={cn(
              "relative cursor-pointer transition-transform duration-500 preserve-3d",
              isFlipped && "rotate-y-180"
            )}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <Card
              className={cn(
                "min-h-[300px] md:min-h-[400px] flex flex-col justify-center items-center p-8",
                isFlipped && "invisible"
              )}
            >
              <CardContent className="text-center space-y-4">
                <Badge
                  className={cn(
                    "text-white",
                    difficultyColors[currentCard.difficulty]
                  )}
                >
                  {currentCard.difficulty}
                </Badge>
                <div className="flex flex-wrap gap-1 justify-center">
                  {currentCard.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <h2 className="text-xl md:text-2xl font-medium">{currentCard.question}</h2>
                <p className="text-sm text-muted-foreground">Click to reveal answer</p>
              </CardContent>
            </Card>

            {/* Back */}
            <Card
              className={cn(
                "absolute inset-0 min-h-[300px] md:min-h-[400px] flex flex-col justify-center items-center p-8 bg-primary/5",
                !isFlipped && "invisible"
              )}
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <CardContent className="text-center space-y-4">
                <Badge variant="outline">Answer</Badge>
                <p className="text-lg md:text-xl">{currentCard.answer}</p>
                <div className="text-sm text-muted-foreground">
                  How well did you know this?
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Rating Buttons */}
        <AnimatePresence>
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-4 gap-2"
            >
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 py-4 border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={() => handleRate(1)}
              >
                <X className="h-5 w-5" />
                <span className="text-xs">Again</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 py-4 border-orange-500 text-orange-500 hover:bg-orange-500/10"
                onClick={() => handleRate(2)}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Hard</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 py-4 border-green-500 text-green-500 hover:bg-green-500/10"
                onClick={() => handleRate(3)}
              >
                <Check className="h-5 w-5" />
                <span className="text-xs">Good</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 py-4 border-blue-500 text-blue-500 hover:bg-blue-500/10"
                onClick={() => handleRate(4)}
              >
                <Star className="h-5 w-5" />
                <span className="text-xs">Easy</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{correct.size} correct</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-500" />
            <span>{reviewed.size - correct.size} needs review</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
