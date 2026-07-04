"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Trophy,
  Clock,
  Brain,
  RotateCcw,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Quiz } from '@/lib/types';

interface QuizQuestion extends Quiz {
  options?: string[];
  selectedAnswer?: string;
  isCorrect?: boolean;
  timeTaken?: number;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [answers, setAnswers] = useState<Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeTaken: number;
  }>>([]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted = data.map((q) => ({
          ...q,
          options: Array.isArray(q.choices) ? (q.choices as string[]) : [],
        }));
        setQuestions(formatted);
      } else {
        const sampleQuestions: QuizQuestion[] = [
          {
            id: '1',
            user_id: 'demo',
            question: 'What is the basic unit of quantum information?',
            question_type: 'mcq',
            choices: ['Qubit', 'Bit', 'Byte', 'Word'],
            options: ['Qubit', 'Bit', 'Byte', 'Word'],
            correct_answer: 'Qubit',
            explanation: 'A qubit (quantum bit) is the basic unit of quantum information, analogous to a classical bit.',
            difficulty: 'easy',
            tags: ['quantum', 'basics'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_id: null,
            conversation_id: null,
          },
          {
            id: '2',
            user_id: 'demo',
            question: 'Which phenomenon allows qubits to exist in multiple states simultaneously?',
            question_type: 'mcq',
            choices: ['Superposition', 'Entanglement', 'Interference', 'Tunneling'],
            options: ['Superposition', 'Entanglement', 'Interference', 'Tunneling'],
            correct_answer: 'Superposition',
            explanation: 'Superposition allows a qubit to represent both 0 and 1 simultaneously until measured.',
            difficulty: 'medium',
            tags: ['quantum', 'physics'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_id: null,
            conversation_id: null,
          },
          {
            id: '3',
            user_id: 'demo',
            question: 'Quantum entanglement implies that measuring one particle affects its entangled partner:',
            question_type: 'mcq',
            choices: ['Instantly, regardless of distance', 'Only when close together', 'After a time delay', 'Never'],
            options: ['Instantly, regardless of distance', 'Only when close together', 'After a time delay', 'Never'],
            correct_answer: 'Instantly, regardless of distance',
            explanation: 'Entangled particles are correlated so that measuring one instantly affects the state of the other, no matter the distance between them.',
            difficulty: 'hard',
            tags: ['quantum', 'entanglement'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_id: null,
            conversation_id: null,
          },
          {
            id: '4',
            user_id: 'demo',
            question: 'What is quantum decoherence?',
            question_type: 'mcq',
            choices: [
              'Loss of quantum properties due to environment interaction',
              'Increase in quantum coherence',
              'Creation of entangled particles',
              'Measurement of qubits',
            ],
            options: [
              'Loss of quantum properties due to environment interaction',
              'Increase in quantum coherence',
              'Creation of entangled particles',
              'Measurement of qubits',
            ],
            correct_answer: 'Loss of quantum properties due to environment interaction',
            explanation: 'Decoherence occurs when a quantum system loses its quantum behavior due to interaction with the environment, causing the system to behave classically.',
            difficulty: 'hard',
            tags: ['quantum', 'decoherence'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            document_id: null,
            conversation_id: null,
          },
        ];
        setQuestions(sampleQuestions);
      }
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    setShowExplanation(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correct_answer;
    const timeTaken = Date.now() - questionStartTime;

    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswers([
      ...answers,
      {
        questionId: currentQuestion.id,
        answer,
        isCorrect,
        timeTaken,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsFinished(false);
    setScore(0);
    setAnswers([]);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              No Quiz Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Generate quiz questions from your conversations or documents to test your knowledge.
            </p>
            <Link href="/">
              <Button className="w-full">Go to Chat</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    const avgTime = Math.round(totalTime / questions.length);
    const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';
    const gradeColor = percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500';

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg space-y-8"
        >
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="inline-flex"
            >
              <Trophy className="h-16 w-16 text-yellow-500" />
            </motion.div>
            <h1 className="text-3xl font-bold">Quiz Complete!</h1>
            <p className="text-muted-foreground">Here's how you did:</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className={cn("text-3xl font-bold", gradeColor)}>{grade}</div>
                <div className="text-sm text-muted-foreground">Grade</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-500">{score}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{percentage}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{avgTime}s</div>
                <div className="text-sm text-muted-foreground">Avg Time</div>
              </CardContent>
            </Card>
          </div>

          {/* Answer Review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Answer Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.slice(0, 5).map((q, i) => {
                const answer = answers.find((a) => a.questionId === q.id);
                return (
                  <div key={q.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium shrink-0",
                        answer?.isCorrect
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      )}
                    >
                      {answer?.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{q.question}</p>
                      <p className="text-xs text-muted-foreground">
                        Your answer: {answer?.answer || 'None'}
                        {!answer?.isCorrect && ` | Correct: ${q.correct_answer}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestart} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

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
              Question {currentIndex + 1} of {questions.length}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                currentQuestion.difficulty === 'easy' && 'text-green-500 border-green-500',
                currentQuestion.difficulty === 'medium' && 'text-yellow-500 border-yellow-500',
                currentQuestion.difficulty === 'hard' && 'text-red-500 border-red-500'
              )}
            >
              {currentQuestion.difficulty}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="p-6">
            <h2 className="text-xl md:text-2xl font-medium mb-6">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correct_answer;
                const showResult = selectedAnswer !== null;

                return (
                  <button
                    key={option}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border-2 transition-all",
                      showResult && isCorrect
                        ? "border-green-500 bg-green-500/10"
                        : showResult && isSelected && !isCorrect
                        ? "border-red-500 bg-red-500/10"
                        : "border-border hover:border-primary/50",
                      !showResult && "hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium shrink-0",
                          showResult && isCorrect
                            ? "bg-green-500 text-white"
                            : showResult && isSelected && !isCorrect
                            ? "bg-red-500 text-white"
                            : "bg-muted"
                        )}
                      >
                        {showResult && isCorrect ? (
                          <Check className="h-4 w-4" />
                        ) : showResult && isSelected && !isCorrect ? (
                          <X className="h-4 w-4" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && currentQuestion.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Explanation</p>
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>{score} correct</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-500" />
              <span>{currentIndex + 1 - score} incorrect</span>
            </div>
          </div>
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
          >
            {currentIndex < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                View Results
                <Trophy className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
