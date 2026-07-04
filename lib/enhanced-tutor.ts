// Enhanced AI Tutor with Local RAG, Citations, and Self-Explanation
// All features are privacy-preserving and work offline

import { localSearch, formatCitation, type Citation } from './document-processor';
import {
  SocraticTutorEngine,
  ProblemBreakdownEngine,
  AdaptiveExplanationGenerator,
  KnowledgeGapDetector,
  type StudentState,
  type TutorModeConfig,
  type SocraticResponse,
  type ProblemBreakdown,
  type KnowledgeGap,
} from './ai/tutor-intelligence';

export interface GroundedResponse {
  content: string;
  citations: Citation[];
  selfExplanationPrompt: string;
  relatedConcepts: string[];
  detectedGaps: KnowledgeGap[];
  followUpQuestions: string[];
}

export interface TutorContext {
  documentIds: string[];
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  studentState: StudentState;
  mode: 'socratic' | 'guidance' | 'direct' | 'problem_breakdown';
}

export interface FlashcardSuggestion {
  front: string;
  back: string;
  sourceCitation: Citation;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export class EnhancedAITutor {
  private socraticEngine: SocraticTutorEngine | null = null;
  private problemBreakdownEngine: ProblemBreakdownEngine;
  private adaptiveGenerator: AdaptiveExplanationGenerator;
  private gapDetector: KnowledgeGapDetector;

  constructor() {
    this.problemBreakdownEngine = new ProblemBreakdownEngine();
    this.adaptiveGenerator = new AdaptiveExplanationGenerator();
    this.gapDetector = new KnowledgeGapDetector();
  }

  // Main method: Answer a question with grounded citations
  async answerWithCitations(
    question: string,
    context: TutorContext
  ): Promise<GroundedResponse> {
    // Step 1: Retrieve relevant context from local documents
    const { context: ragContext, citations } = await localSearch.buildRAGContext(
      question,
      context.documentIds.length > 0 ? context.documentIds : undefined
    );

    // Step 2: Generate response based on mode
    let content = '';
    let selfExplanationPrompt = '';
    const followUpQuestions: string[] = [];

    switch (context.mode) {
      case 'socratic':
        content = await this.generateSocraticResponse(question, ragContext, context);
        selfExplanationPrompt = this.generateSelfExplanationPrompt(question, content);
        break;

      case 'guidance':
        content = await this.generateGuidedResponse(question, ragContext, context);
        selfExplanationPrompt = this.generateSelfExplanationPrompt(question, content);
        break;

      case 'direct':
        content = await this.generateDirectResponse(question, ragContext);
        selfExplanationPrompt = "Now try explaining this concept to someone else in your own words.";
        break;

      case 'problem_breakdown':
        content = await this.generateProblemBreakdownResponse(question);
        selfExplanationPrompt = "Walk through each step and explain your reasoning out loud.";
        break;
    }

    // Step 3: Extract related concepts
    const relatedConcepts = this.extractRelatedConcepts(question, ragContext);

    // Step 4: Detect knowledge gaps based on question patterns
    const detectedGaps = this.detectGapsFromQuestion(question, context.studentState);

    // Step 5: Generate follow-up questions
    followUpQuestions.push(...this.generateFollowUpQuestions(question, context.mode, detectedGaps));

    return {
      content,
      citations,
      selfExplanationPrompt,
      relatedConcepts,
      detectedGaps,
      followUpQuestions,
    };
  }

  private async generateSocraticResponse(
    question: string,
    ragContext: string,
    context: TutorContext
  ): Promise<string> {
    const isDirectQuestion = /what is|define|explain|tell me/i.test(question);
    const isConfused = /don't understand|confused|lost|doesn't make sense/i.test(question);
    const confidence = context.studentState.confidence;

    if (isDirectQuestion) {
      // Don't give direct answer - guide to discovery
      if (ragContext) {
        return `I found some relevant information in your documents. Before I share it, let me ask you:

What do you already know about this topic? Sometimes connecting new information to what you already understand makes it stick better.

${confidence === 'low' ? "Take your time - there's no rush. What's your initial thought?" : "Think about the underlying principles at work here."}`;
      } else {
        return `Great question! Let's explore this together.

What's your current understanding of this topic? Even a rough idea is a good starting point.

What aspects are you most curious about?`;
      }
    }

    if (isConfused) {
      return `I can see you're working through something challenging. That's actually a sign of learning happening - confusion comes before clarity.

Let's break this down:
1. Can you pinpoint exactly where things become unclear?
2. What would you expect to happen instead?

Sometimes articulating the confusion helps us see the path forward.`;
    }

    // Follow-up or exploration question
    return `You're making progress. Let me ask you this:

How does this connect to what you learned earlier?

Can you think of a real-world example where this applies?`;
  }

  private async generateGuidedResponse(
    question: string,
    ragContext: string,
    context: TutorContext
  ): Promise<string> {
    const confidence = context.studentState.confidence;
    const hintDensity = confidence === 'low' ? 'high' : confidence === 'medium' ? 'medium' : 'low';

    let response = '';

    if (ragContext) {
      // Provide hints based on retrieved context
      if (hintDensity === 'high') {
        response = `Based on your materials, here are some key hints:

${this.extractKeyPoints(ragContext, 3)}

Now, can you try connecting these points to answer your question?`;
      } else if (hintDensity === 'medium') {
        response = `Here's a hint from your materials: ${this.extractKeyPoints(ragContext, 1)}

Think about how this relates to your question. What connections can you make?`;
      } else {
        response = `I found relevant information in your documents. What approach would you like to take?

- A direct explanation?
- A hint to guide your thinking?
- Work through it step by step together?`;
      }
    } else {
      response = `Let me guide you through this:

1. What's the core concept you're trying to understand?
2. What do you already know about related topics?
3. What specific part is unclear?

Once we identify that, I can give you targeted hints.`;
    }

    return response;
  }

  private async generateDirectResponse(
    question: string,
    ragContext: string
  ): Promise<string> {
    if (ragContext) {
      return `Based on your uploaded materials:

${ragContext}

---

**Key Takeaway:**
${this.extractKeyPoints(ragContext, 2)}

Would you like me to:
- Generate flashcards from this?
- Test your understanding with a question?
- Explain any part in more detail?`;
    }

    return `Let me explain this concept for you.

## Overview
This is a fundamental concept that builds on several key principles.

## How It Works
The mechanism involves several interconnected processes that work together.

## Why It Matters
Understanding this concept helps you:
- Solve related problems more easily
- Build on it for more advanced topics
- Apply it in practical situations

Would you like me to explain further, or shall we practice with some examples?`;
  }

  private async generateProblemBreakdownResponse(question: string): Promise<string> {
    const breakdown = this.problemBreakdownEngine.breakdown(question, 'intermediate');

    return `I've broken this problem down into ${breakdown.steps.length} manageable steps:

${breakdown.steps.map((step, i) =>
  `**Step ${i + 1}:** ${step.description}\n*Type: ${step.type} | Difficulty: ${step.difficulty}/3*`
).join('\n\n')}

---

Each step includes:
- **Hints** if you get stuck (just click to reveal)
- **Common pitfalls** to watch out for
- **Self-check questions** to verify understanding

Ready to start with Step 1?`;
  }

  // Generate flashcards from document content
  async generateFlashcardsFromDocument(
    documentId: string,
    topic?: string
  ): Promise<FlashcardSuggestion[]> {
    const chunks = await localSearch.search(
      topic || 'key concepts definitions important terms',
      [documentId]
    );

    const flashcards: FlashcardSuggestion[] = [];

    for (const chunk of chunks.slice(0, 5)) {
      // Extract question-answer pairs from the text
      const qaPairs = this.extractQAFromText(chunk.text);
      for (const qa of qaPairs) {
        flashcards.push({
          front: qa.question,
          back: qa.answer,
          sourceCitation: {
            documentId: chunk.documentId,
            documentTitle: 'Document',
            pageNumber: chunk.pageNumber,
            paragraphNumber: chunk.paragraphNumber,
            text: chunk.text.slice(0, 150),
            chunkId: chunk.id,
          },
          difficulty: this.estimateDifficulty(qa.answer),
          tags: this.extractTags(chunk.text),
        });
      }
    }

    return flashcards;
  }

  // Evaluate student's self-explanation against source
  async evaluateSelfExplanation(
    studentExplanation: string,
    originalQuestion: string,
    sourceContext: string
  ): Promise<{
    score: number;
    feedback: string;
    missing: string[];
    accurate: string[];
    misconceptions: string[];
  }> {
    const explanationLower = studentExplanation.toLowerCase();
    const sourceKeywords = this.extractKeywords(sourceContext);
    const questionKeywords = this.extractKeywords(originalQuestion);

    const missing: string[] = [];
    const accurate: string[] = [];
    const misconceptions: string[] = [];

    // Check for key concepts from source
    sourceKeywords.forEach(keyword => {
      if (explanationLower.includes(keyword.toLowerCase())) {
        accurate.push(keyword);
      } else if (questionKeywords.includes(keyword) && !explanationLower.includes(keyword.toLowerCase())) {
        missing.push(keyword);
      }
    });

    // Detect potential misconceptions
    const misconceptionPatterns = [
      { pattern: /quantum.*faster.*light/i, misconception: "Quantum entanglement doesn't enable faster-than-light communication" },
      { pattern: /evolution.*random|evolution.*chance/i, misconception: "Evolution combines random mutation with non-random natural selection" },
      { pattern: /more\s+evolved|less\s+evolved/i, misconception: "Evolution has no goal or hierarchy - species are adapted to different niches" },
    ];

    misconceptionPatterns.forEach(({ pattern, misconception }) => {
      if (pattern.test(studentExplanation)) {
        misconceptions.push(misconception);
      }
    });

    // Calculate score
    const coverageScore = accurate.length / Math.max(sourceKeywords.length, 1);
    const misconceptionPenalty = misconceptions.length * 0.2;
    const score = Math.max(0, Math.min(1, coverageScore - misconceptionPenalty));

    let feedback = '';
    if (score >= 0.8) {
      feedback = "Excellent explanation! You've captured the key concepts accurately.";
    } else if (score >= 0.6) {
      feedback = `Good understanding! You covered ${accurate.length} key points. Consider exploring: ${missing.slice(0, 2).join(', ')}.`;
    } else if (score >= 0.4) {
      feedback = `You're on the right track. Let's review the key concepts: ${missing.slice(0, 3).join(', ')}.`;
    } else {
      feedback = "Let's break this down together. Can you tell me which part is most unclear?";
    }

    if (misconceptions.length > 0) {
      feedback += `\n\n**Note:** ${misconceptions.join(' ')}`;
    }

    return {
      score,
      feedback,
      missing,
      accurate,
      misconceptions,
    };
  }

  // Helper methods
  private extractKeyPoints(text: string, count: number): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, count).map(s => s.trim()).join('\n\n');
  }

  private extractRelatedConcepts(question: string, context: string): string[] {
    const concepts: string[] = [];
    const keywords = this.extractKeywords(question + ' ' + context);
    return keywords.slice(0, 5);
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'were', 'they', 'their', 'what', 'when', 'where', 'which', 'while']);
    return Array.from(new Set(
      words.filter(w => !stopWords.has(w) && w.length > 4)
    )).slice(0, 10);
  }

  private detectGapsFromQuestion(question: string, _studentState: StudentState): KnowledgeGap[] {
    // Simple gap detection based on question patterns
    const gaps: KnowledgeGap[] = [];

    const gapPatterns = [
      {
        pattern: /how do|don't understand|confused/i,
        concept: 'General understanding',
        type: 'weak' as const,
      },
      {
        pattern: /what is the difference|versus|vs/i,
        concept: 'Conceptual distinction',
        type: 'misunderstood' as const,
      },
      {
        pattern: /why does|explain why/i,
        concept: 'Causal reasoning',
        type: 'missing' as const,
      },
    ];

    gapPatterns.forEach(({ pattern, concept, type }) => {
      if (pattern.test(question)) {
        gaps.push({
          conceptId: concept.toLowerCase().replace(/\s+/g, '-'),
          conceptName: concept,
          gapType: type,
          severity: 0.7,
          blockingConcepts: [],
          recommendedResources: [],
          practiceQuestions: [],
          recoveryPath: [],
        });
      }
    });

    return gaps;
  }

  private generateSelfExplanationPrompt(originalQuestion: string, _answer: string): string {
    const prompts = [
      `Now, can you explain this back to me in your own words? This helps solidify your understanding.`,
      `Try teaching this concept to someone else. What would you say?`,
      `If you had to give a 1-minute summary of this, what would you focus on?`,
      `How would you explain this to someone who hasn't studied this topic before?`,
    ];

    const hasContext = originalQuestion.includes('page') || originalQuestion.includes('document');
    if (hasContext) {
      return `Based on what you just learned, can you summarize the key insight? Being able to restate concepts in your own words is a powerful learning technique.`;
    }

    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  private generateFollowUpQuestions(
    _question: string,
    mode: string,
    gaps: KnowledgeGap[]
  ): string[] {
    const questions: string[] = [];

    if (gaps.length > 0) {
      questions.push(`Would you like to address the knowledge gap in ${gaps[0].conceptName}?`);
    }

    if (mode === 'socratic') {
      questions.push(
        "Shall we explore a related concept?",
        "Do you want to try a practice problem?"
      );
    } else if (mode === 'direct') {
      questions.push(
        "Shall I generate flashcards for review?",
        "Would you like a quiz to test understanding?"
      );
    }

    return questions.slice(0, 2);
  }

  private extractQAFromText(text: string): Array<{ question: string; answer: string }> {
    const pairs: Array<{ question: string; answer: string }> = [];

    // Look for definition patterns
    const defMatches = text.matchAll(/([A-Z][a-z]+(?:\s+[a-z]+)*)\s+(?:is|are|refers to|means)\s+([^.]+)/g);
    for (const match of defMatches) {
      pairs.push({
        question: `What is ${match[1]}?`,
        answer: match[2].trim(),
      });
    }

    // If no definitions found, create general Q&A
    if (pairs.length === 0 && text.length > 50) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      if (sentences.length >= 2) {
        pairs.push({
          question: `Explain the main concept from this text.`,
          answer: sentences[0].trim() + '. ' + sentences[1].trim(),
        });
      }
    }

    return pairs.slice(0, 3);
  }

  private estimateDifficulty(answer: string): 'easy' | 'medium' | 'hard' {
    const words = answer.split(/\s+/).length;
    if (words < 15) return 'easy';
    if (words < 30) return 'medium';
    return 'hard';
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const tagPatterns = [
      /\b(definition|concept|formula|theory|principle|law)\b/gi,
      /\b(calculus|physics|chemistry|biology|math)\b/gi,
    ];

    tagPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        tags.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return Array.from(new Set(tags)).slice(0, 3);
  }
}

// Export singleton
export const enhancedTutor = new EnhancedAITutor();

// Self-explanation checker component types
export interface SelfExplanationCheck {
  originalExplanation: string;
  studentExplanation: string;
  result: {
    score: number;
    feedback: string;
    missing: string[];
    accurate: string[];
    misconceptions: string[];
  };
}
