# Architecture Overview

This document provides a comprehensive overview of AI OpenTutor's architecture, design decisions, and technical implementation.

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client (Browser)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Presentation Layer                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │
│  │  │   Pages     │  │  Components │  │   Hooks     │              │    │
│  │  │ (Next.js)   │  │  (React)     │  │  (State)    │              │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                 │                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Business Logic Layer                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │    │
│  │  │   Tutor     │  │    RAG       │  │   Document  │              │    │
│  │  │   Engine    │  │   Pipeline   │  │  Processor  │              │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                 │                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        Data Layer                                │    │
│  │  ┌─────────────────────┐    ┌─────────────────────┐             │    │
│  │  │ IndexedDB (Primary) │    │ Supabase (Optional) │             │    │
│  │  │ • Documents         │    │ • User profiles    │             │    │
│  │  │ • Chunks            │    │ • Conversations    │             │    │
│  │  │ • Flashcards        │    │ • Cloud sync       │             │    │
│  │  └─────────────────────┘    └─────────────────────┘             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                 │                                    │
                 │ (Offline)                          │ (Online - Optional)
                 ▼                                    ▼
        ┌────────────────┐                 ┌────────────────┐
        │  Browser APIs │                 │ Supabase Cloud │
        │  • Storage    │                 │  • PostgreSQL  │
        │  • WebWorker  │                 │  • Auth        │
        └────────────────┘                 └────────────────┘
```

---

## 📦 Core Components

### 1. Document Processing Pipeline

**File**: `lib/document-processor.ts`

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Upload     │─────▶│   Validate   │─────▶│   Process   │
│   (Dropzone) │      │              │      │             │
└──────────────┘      └──────────────┘      └──────────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────┐
                    ▼                              ▼                          ▼
           ┌──────────────┐               ┌──────────────┐          ┌──────────────┐
           │    PDF.js    │               │  Tesseract.js│          │   Text       │
           │  (PDF text)  │               │   (OCR)      │          │  (Direct)    │
           └──────────────┘               └──────────────┘          └──────────────┘
                    │                              │                          │
                    └──────────────────────────────┼──────────────────────────┘
                                                   ▼
                                           ┌──────────────┐
                                           │   Chunker    │
                                           │ (w/ overlap) │
                                           └──────────────┘
                                                   │
                                                   ▼
                                           ┌──────────────┐
                                           │  IndexedDB  │
                                           │   Storage    │
                                           └──────────────┘
```

**Key Features**:
- Browser-only processing (no server)
- Chunking with overlap for better retrieval
- Page and paragraph tracking for citations

### 2. RAG (Retrieval Augmented Generation) Pipeline

**File**: `lib/document-processor.ts` (LocalSearch class)

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Query      │─────▶│   Search     │─────▶│   Rank       │
│              │      │  IndexedDB   │      │   Results    │
└──────────────┘      └──────────────┘      └──────────────┘
                                                   │
                                                   ▼
                                           ┌──────────────┐
                                           │ Build Context│
                                           │ + Citations  │
                                           └──────────────┘
```

**Implementation**:

```typescript
async buildRAGContext(
  query: string,
  documentIds?: string[],
  maxTokens: number = 2000
): Promise<{ context: string; citations: Citation[] }> {
  const results = await this.search(query, documentIds);
  
  let context = '';
  const citations: Citation[] = [];
  
  for (const chunk of results) {
    context += `[Page ${chunk.pageNumber}, Para ${chunk.paragraphNumber}]: ${chunk.text}\n\n`;
    citations.push({
      documentId: chunk.documentId,
      pageNumber: chunk.pageNumber,
      paragraphNumber: chunk.paragraphNumber,
      text: chunk.text.slice(0, 150),
      chunkId: chunk.id,
    });
  }
  
  return { context, citations };
}
```

### 3. Tutor Intelligence Engine

**File**: `lib/ai/tutor-intelligence.ts`

```
┌─────────────────────────────────────────────────────────────────┐
│                     Tutor Intelligence                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │   Socratic       │  │   Problem        │  │   Adaptive     │ │
│  │   Engine         │  │   Breakdown      │  │   Generator    │ │
│  │                  │  │                  │  │                │ │
│  │ • Question types │  │ • Step analysis  │  │ • Style-based  │ │
│  │ • Hint density   │  │ • Difficulty est │  │ • Depth levels │ │
│  │ • Pivots         │  │ • Misconceptions │  │ • Examples     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │   Knowledge Gap  │  │         Misconception                  │ │
│  │   Detector       │  │         Detection                      │ │
│  │                  │  │                                        │ │
│  │ • Prerequisites  │  │ • Common misconceptions library       │ │
│  │ • Severity calc  │  │ • Pattern matching                     │ │
│  │ • Recovery path  │  │ • Correction suggestions               │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Enhanced Tutor Orchestrator

**File**: `lib/enhanced-tutor.ts`

Connects all components:

```typescript
async answerWithCitations(
  question: string,
  context: TutorContext
): Promise<GroundedResponse> {
  // 1. Retrieve relevant context
  const { context: ragContext, citations } = await localSearch.buildRAGContext(question);
  
  // 2. Generate response based on mode
  let content = '';
  switch (context.mode) {
    case 'socratic':
      content = await this.generateSocraticResponse(question, ragContext, context);
      break;
    case 'guidance':
      content = await this.generateGuidedResponse(question, ragContext, context);
      break;
    // ... other modes
  }
  
  // 3. Detect knowledge gaps
  const detectedGaps = this.detectGapsFromQuestion(question, context.studentState);
  
  // 4. Generate follow-up questions
  const followUpQuestions = this.generateFollowUpQuestions(question, context.mode, detectedGaps);
  
  return { content, citations, selfExplanationPrompt, relatedConcepts, detectedGaps, followUpQuestions };
}
```

### 5. Local Storage Layer

**File**: `lib/local-storage.ts`

```
┌─────────────────────────────────────────────────────────────────┐
│                     LocalStorageDB                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  IndexedDB Database: 'ai-tutor-local' (v1)                       │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │   documents    │  │    chunks       │  │   flashcards      │  │
│  │                │  │                 │  │                   │  │
│  │ • id (PK)      │  │ • id (PK)       │  │ • id (PK)         │  │
│  │ • title        │  │ • documentId    │  │ • front/back      │  │
│  │ • fileType     │  │ • pageNumber    │  │ • easeFactor      │  │
│  │ • status       │  │ • paragraphNum  │  │ • interval        │  │
│  │ • progress     │  │ • text          │  │ • nextReviewDate  │  │
│  └────────────────┘  └────────────────┘  └────────────────────┘  │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │   sessions     │  │   bookmarks    │                         │
│  │                │  │                │                         │
│  │ • concepts     │  │ • citations    │                         │
│  │ • gaps         │  │ • notes        │                         │
│  └────────────────┘  └────────────────┘                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎓 Learning Science Implementation

### SM-2 Spaced Repetition Algorithm

**Implementation in**: `lib/local-storage.ts`

```typescript
export class SpacedRepetitionSM2 {
  calculate(
    quality: number,      // 0-5 (user rating)
    easeFactor: number,   // Current ease factor
    interval: number,     // Current interval in days
    repetitions: number   // Number of successful reviews
  ): SM2Result {
    let newEaseFactor = easeFactor;
    let newInterval = interval;
    let newRepetitions = repetitions;
    
    if (quality >= 3) {
      // Successful recall
      if (repetitions === 0) {
        newInterval = 1;
      } else if (repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * easeFactor);
      }
      newRepetitions = repetitions + 1;
    } else {
      // Failed recall - reset
      newRepetitions = 0;
      newInterval = 1;
    }
    
    // Ease factor formula:
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    
    return {
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReviewDate: this.getNextReviewDate(newInterval),
    };
  }
}
```

### Socratic Tutor Mode

**Response types based on analysis**:

```typescript
// Question classification
if (isDirectQuestion) {
  // Guide to discovery instead of giving answer
  return "What do you already know about this topic?";
}

if (isConfused) {
  // Help identify specific confusion
  return "Can you pinpoint exactly where things become unclear?";
}

// Follow-up exploration
return "How does this connect to what you learned earlier?";
```

---

## 🔒 Privacy Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Document Data                              ││
│  │  • PDFs, Images, Text files                                   ││
│  │  • NEVER leaves the browser                                   ││
│  │  • Processed by PDF.js / Tesseract.js                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                    │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    IndexedDB                                  ││
│  │  • All document content                                       ││
│  │  • Chunks for RAG                                             ││
│  │  • Flashcard data                                             ││
│  │  • Study sessions                                             ││
│  │  • 100% local storage                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           │                                      │
           ▼                                      ▼
  ┌────────────────┐                   ┌────────────────┐
  │   Local Mode   │                   │   Cloud Mode   │
  │                │                   │   (Optional)   │
  │  No external   │                   │                │
  │  connections   │                   │  Supabase:     │
  │                │                   │  • Auth only   │
  │  ✓ Privacy     │                   │  • Sync prefs  │
│  │  maximum      │                   │                │
└────────────────┘                   └────────────────┘
```

### Offline-First Design

- All core features work without internet
- IndexedDB as primary storage
- Optional cloud sync when online
- Graceful degradation

---

## 📊 Performance Considerations

### Document Processing

- **Lazy loading**: PDF.js and Tesseract.js loaded on demand
- **Web Workers**: OCR runs in separate thread (future)
- **Chunking**: Overlap strategy for better retrieval
- **Progress tracking**: Real-time processing updates

### Search Optimization

```typescript
// Keyword-based search (can be upgraded to semantic)
async search(query: string, documentIds?: string[]) {
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  const scored = chunks.map(chunk => {
    let score = 0;
    queryTerms.forEach(term => {
      const matches = chunk.text.toLowerCase().match(new RegExp(term, 'gi'));
      if (matches) {
        score += matches.length * (term.length / queryTerms.length);
      }
    });
    return { ...chunk, score };
  });
  
  return scored.filter(c => c.score > 0).sort((a, b) => b.score - a.score);
}
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Service role key (server) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk public key |
| `CLERK_SECRET_KEY` | No | Clerk secret key |

---

## 🚀 Deployment Options

1. **Static Export**: Fully static, no server required
2. **Vercel**: Recommended for Next.js
3. **Netlify**: With serverless functions
4. **Self-hosted**: Node.js server

See [DEPLOYMENT.md](./DEPLOYMENT.md) for details.

---

## 🔮 Future Architecture

Planned improvements:

### Semantic Search with Transformers.js

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Document   │─────▶│  Embedding   │─────▶│  Vector      │
│   Chunks     │      │  Model       │      │  Store       │
└──────────────┘      └──────────────┘      └──────────────┘
                                                    │
                              ┌─────────────────────┘
                              ▼
                      ┌──────────────┐
                      │   Semantic   │
                      │   Search     │
                      └──────────────┘
```

### WebRTC Collaboration

```
┌──────────────┐                    ┌──────────────┐
│   User A     │◄───WebRTC P2P────▶│   User B     │
│   Browser    │                    │   Browser    │
└──────────────┘                    └──────────────┘
       │                                    │
       └──────────────┬─────────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │   Shared     │
              │   State      │
              └──────────────┘
```

---

## 📚 Related Documentation

- [API Reference](./API.md)
- [Learning Science](./LEARNING_SCIENCE.md)
- [Deployment Guide](./DEPLOYMENT.md)
