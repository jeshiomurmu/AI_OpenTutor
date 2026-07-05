# API Reference

Comprehensive API documentation for AI OpenTutor's core modules.

---

## 📦 Core Modules

### LocalStorageDB

**File**: `lib/local-storage.ts`

The primary storage layer using IndexedDB for offline-first data persistence.

#### Methods

##### `init(): Promise<IDBDatabase>`

Initialize the database connection.

```typescript
import { localDB } from '@/lib/local-storage';

// Auto-initialized on first use
const db = await localDB.init();
```

##### `addDocument(doc: LocalDocument): Promise<void>`

Store a new document record.

```typescript
await localDB.addDocument({
  id: crypto.randomUUID(),
  title: 'My PDF',
  filename: 'mypdf.pdf',
  fileType: 'pdf',
  size: 1024000,
  createdAt: new Date(),
  lastAccessedAt: new Date(),
  processingStatus: 'pending',
  processingProgress: 0,
});
```

##### `getDocument(id: string): Promise<LocalDocument | null>`

Retrieve a document by ID.

```typescript
const doc = await localDB.getDocument('doc-uuid-here');
```

##### `getAllDocuments(): Promise<LocalDocument[]>`

Get all stored documents.

```typescript
const docs = await localDB.getAllDocuments();
console.log(`${docs.length} documents stored`);
```

##### `updateDocument(id: string, updates: Partial<LocalDocument>): Promise<void>`

Update document metadata.

```typescript
await localDB.updateDocument('doc-id', {
  processingStatus: 'completed',
  processingProgress: 100,
});
```

##### `deleteDocument(id: string): Promise<void>`

Delete a document and all its chunks.

```typescript
await localDB.deleteDocument('doc-id');
```

##### `addChunks(chunks: DocumentChunk[]): Promise<void>`

Store document chunks for RAG.

```typescript
await localDB.addChunks([
  {
    id: 'chunk-1',
    documentId: 'doc-id',
    chunkIndex: 0,
    pageNumber: 1,
    paragraphNumber: 1,
    text: 'Content here...',
    startOffset: 0,
    endOffset: 500,
  },
]);
```

##### `getChunksForDocument(documentId: string): Promise<DocumentChunk[]>`

Retrieve all chunks for a document.

```typescript
const chunks = await localDB.getChunksForDocument('doc-id');
```

---

### DocumentProcessor

**File**: `lib/document-processor.ts`

Handles PDF extraction, OCR, and text chunking.

#### Classes

#### PDFProcessor

Processes PDF files using PDF.js.

```typescript
import { PDFProcessor } from '@/lib/document-processor';

const processor = new PDFProcessor((progress) => {
  console.log(`Stage: ${progress.stage}, Progress: ${progress.progress}%`);
});

const result = await processor.processPDF(file, documentId);
// result: { chunks: DocumentChunk[], pageCount: number, text: string }
```

#### OCRProcessor

Extracts text from images using Tesseract.js.

```typescript
import { OCRProcessor } from '@/lib/document-processor';

const ocr = new OCRProcessor((progress) => {
  console.log(`OCR Progress: ${progress.progress}%`);
});

const result = await ocr.processImage(imageFile, documentId);
// result: { text: string, chunks: DocumentChunk[] }
```

#### DocumentManager

High-level document processing orchestration.

```typescript
import { documentManager } from '@/lib/document-processor';

const doc = await documentManager.processDocument(file, (progress) => {
  console.log(progress.message);
});

// doc: LocalDocument with processing status
```

#### LocalSearch

Keyword-based search over document chunks.

```typescript
import { localSearch } from '@/lib/document-processor';

// Simple search
const results = await localSearch.search('quantum computing', ['doc-id']);
// returns: Array<DocumentChunk & { score: number }>

// Build RAG context
const { context, citations } = await localSearch.buildRAGContext(
  'What is quantum entanglement?',
  ['doc-id'],
  2000 // max tokens
);
```

---

### EnhancedAITutor

**File**: `lib/enhanced-tutor.ts`

The main tutor engine combining RAG with learning science.

#### Methods

##### `answerWithCitations(question, context): Promise<GroundedResponse>`

Main method for tutoring with citations.

```typescript
import { enhancedTutor } from '@/lib/enhanced-tutor';

const response = await enhancedTutor.answerWithCitations(
  'What is quantum superposition?',
  {
    documentIds: ['doc-1', 'doc-2'],
    conversationHistory: [
      { role: 'user', content: 'Tell me about quantum physics' },
      { role: 'assistant', content: 'Quantum physics is...' },
    ],
    studentState: {
      confidence: 'medium',
      learningStyle: 'reading',
      knowledgeLevel: 'intermediate',
      attentionSpan: 'medium',
      struggling: false,
      questionHistory: [],
      misconceptions: [],
    },
    mode: 'socratic',
  }
);

// Response:
// {
//   content: string,
//   citations: Citation[],
//   selfExplanationPrompt: string,
//   relatedConcepts: string[],
//   detectedGaps: KnowledgeGap[],
//   followUpQuestions: string[]
// }
```

##### `generateFlashcardsFromDocument(documentId, topic?): Promise<FlashcardSuggestion[]>`

Generate flashcards from document content.

```typescript
const flashcards = await enhancedTutor.generateFlashcardsFromDocument(
  'doc-id',
  'key concepts' // optional topic filter
);

// Returns array of:
// {
//   front: string,
//   back: string,
//   sourceCitation: Citation,
//   difficulty: 'easy' | 'medium' | 'hard',
//   tags: string[]
// }
```

##### `evaluateSelfExplanation(explanation, question, context): Promise<EvaluationResult>`

Evaluate a student's self-explanation.

```typescript
const result = await enhancedTutor.evaluateSelfExplanation(
  'Quantum superposition is when a particle can be in multiple states at once...',
  'What is quantum superposition?',
  sourceContextFromRAG
);

// Result:
// {
//   score: number,          // 0-1
//   feedback: string,
//   missing: string[],      // Concepts not covered
//   accurate: string[],     // Correctly mentioned concepts
//   misconceptions: string[] // Detected misconceptions
// }
```

---

### SpacedRepetitionSM2

**File**: `lib/local-storage.ts`

Implements the SM-2 spaced repetition algorithm.

```typescript
import { SpacedRepetitionSM2 } from '@/lib/local-storage';

const sm2 = new SpacedRepetitionSM2();

const result = sm2.calculate(
  4,     // quality (0-5)
  2.5,   // current ease factor
  7,     // current interval
  3      // repetitions
);

// result:
// {
//   easeFactor: 2.6,
//   interval: 18,
//   repetitions: 4,
//   nextReviewDate: Date
// }
```

#### Quality Scale

| Rating | Meaning | Behavior |
|--------|---------|----------|
| 0 | Complete failure | Reset interval to 1 |
| 1 | Incorrect | Reset interval to 1 |
| 2 | Incorrect, but recalled | Reset interval to 1 |
| 3 | Correct with difficulty | Increase interval minimally |
| 4 | Correct | Normal interval increase |
| 5 | Perfect recall | Maximum interval increase |

---

## 📝 Types

### LocalDocument

```typescript
interface LocalDocument {
  id: string;
  title: string;
  filename: string;
  fileType: 'pdf' | 'image' | 'text';
  size: number;
  pageCount?: number;
  thumbnail?: string;
  createdAt: Date;
  lastAccessedAt: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingProgress: number;
}
```

### DocumentChunk

```typescript
interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  paragraphNumber: number;
  text: string;
  embedding?: number[];
  startOffset: number;
  endOffset: number;
}
```

### Citation

```typescript
interface Citation {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  paragraphNumber: number;
  text: string;
  chunkId: string;
}
```

### Flashcard

```typescript
interface Flashcard {
  id: string;
  documentId: string;
  chunkId?: string;
  front: string;
  back: string;
  tags: string[];
  // SM-2 fields
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate?: Date;
  createdAt: Date;
}
```

### StudentState

```typescript
interface StudentState {
  confidence: 'high' | 'medium' | 'low' | 'unsure';
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced';
  attentionSpan: 'short' | 'medium' | 'long';
  struggling: boolean;
  questionHistory: QuestionPattern[];
  misconceptions: Misconception[];
}
```

### KnowledgeGap

```typescript
interface KnowledgeGap {
  conceptId: string;
  conceptName: string;
  gapType: 'missing' | 'weak' | 'misunderstood' | 'forgotten';
  severity: number; // 0-1
  blockingConcepts: string[];
  recommendedResources: string[];
  practiceQuestions: string[];
  recoveryPath: LearningPathNode[];
}
```

---

## ⚛️ React Components

### EnhancedTutorChat

**File**: `components/enhanced-tutor-chat.tsx`

The main chat interface component.

```tsx
import { EnhancedTutorChat } from '@/components/enhanced-tutor-chat';

function Dashboard() {
  return <EnhancedTutorChat />;
}
```

#### Props

This component manages its own state internally. No props required.

#### Features

- 4 tutor modes (Socratic, Guided, Direct, Problem Solver)
- Confidence level indicator
- Self-explanation prompts
- Citation display
- Flashcard generation trigger

### DocumentViewer

**File**: `components/document-viewer.tsx`

PDF viewer with citation navigation.

```tsx
import { DocumentViewer, DocumentLibrary } from '@/components/document-viewer';

function StudyPage() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  
  return (
    <div>
      <DocumentLibrary onSelect={setSelectedDoc} />
      {selectedDoc && (
        <DocumentViewer documentId={selectedDoc} />
      )}
    </div>
  );
}
```

### FlashcardReview

**File**: `app/flashcards/page.tsx`

Flashcard review interface with spaced repetition.

```tsx
// Navigate to /flashcards route

// Features:
// - Flashcard flip animation
// - 4-level difficulty rating
// - Progress tracking
// - Session results
```

---

## 🔗 State Management (Zustand)

### useConversationStore

```typescript
import { useConversationStore } from '@/lib/stores';

const {
  conversations,
  activeConversationId,
  messages,
  addConversation,
  setActiveConversation,
  addMessage,
  updateMessage,
  deleteConversation,
} = useConversationStore();
```

### useSettingsStore

```typescript
import { useSettingsStore } from '@/lib/stores';

const {
  preferences,
  setPreferences,
} = useSettingsStore();

// preferences:
// {
//   defaultProvider: 'openai' | 'anthropic' | 'local',
//   defaultModel: string,
//   sendOnEnter: boolean,
//   theme: 'light' | 'dark' | 'system'
// }
```

### useAuthStore

```typescript
import { useAuthStore } from '@/lib/stores';

const {
  user,
  isLoading,
  setUser,
} = useAuthStore();
```

---

## 🎨 UI Components (shadcn/ui)

All components are in `components/ui/`:

| Component | Usage |
|-----------|-------|
| `Button` | Primary actions |
| `Input` | Text input |
| `Textarea` | Multi-line text |
| `Card` | Content containers |
| `Dialog` | Modal overlays |
| `DropdownMenu` | Select menus |
| `Progress` | Progress bars |
| `Badge` | Labels & tags |
| `Avatar` | User icons |
| `ScrollArea` | Scrollable containers |

See `components.json` for theme configuration.

---

## 🔄 Event Handling

### Document Upload

```typescript
// In upload-modal.tsx
const onDrop = useCallback((acceptedFiles: File[]) => {
  // Validate files
  // Add to upload queue
  // Process each file
}, []);

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg'],
    'text/*': ['.txt', '.md'],
  },
  maxSize: 50 * 1024 * 1024, // 50MB
});
```

### Chat Submit

```typescript
// In enhanced-tutor-chat.tsx
const handleSubmit = async (e?: React.FormEvent) => {
  e?.preventDefault();
  
  // 1. Add user message
  // 2. Call enhancedTutor.answerWithCitations()
  // 3. Stream response
  // 4. Display self-explanation prompt
  // 5. Show citations
};
```

---

## 📊 Progress Reporting

```typescript
interface ProcessingProgress {
  stage: 'loading' | 'extracting' | 'chunking' | 'embedding' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

// Usage
const onProgress = (p: ProcessingProgress) => {
  console.log(`[${p.stage}] ${p.progress}%: ${p.message}`);
};

const processor = new PDFProcessor(onProgress);
```

---

## ⚠️ Error Handling

All async operations should be wrapped in try-catch:

```typescript
try {
  const result = await documentManager.processDocument(file, onProgress);
  toast.success('Document processed successfully');
} catch (error) {
  console.error('Processing failed:', error);
  toast.error('Failed to process document');
}
```

---

## 🔐 Security Considerations

1. **Client-side processing**: All documents stay in browser
2. **No external API calls**: In local mode
3. **Content Security Policy**: Configured in next.config.js
4. **XSS Prevention**: React handles escaping
5. **Input Validation**: File types and size checked

---

## 📚 Additional Resources

- [Architecture Overview](./ARCHITECTURE.md)
- [Learning Science Methods](./LEARNING_SCIENCE.md)
- [Deployment Guide](./DEPLOYMENT.md)
