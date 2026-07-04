// Local-First Storage Layer using IndexedDB
// All document data stays on device - zero cloud dependency

const DB_NAME = 'ai-tutor-local';
const DB_VERSION = 1;

// Database schemas
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

interface Flashcard {
  id: string;
  documentId: string;
  chunkId?: string;
  front: string;
  back: string;
  tags: string[];
  // SM-2 Algorithm fields
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  lastReviewDate?: Date;
  createdAt: Date;
}

interface StudySession {
  id: string;
  documentId?: string;
  startedAt: Date;
  endedAt?: Date;
  questionsAsked: number;
  correctAnswers: number;
  conceptsLearned: string[];
  knowledgeGapsIdentified: string[];
}

interface CitationBookmark {
  id: string;
  documentId: string;
  pageNumber: number;
  paragraphNumber: number;
  text: string;
  note?: string;
  createdAt: Date;
}

class LocalStorageDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Documents store
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('createdAt', 'createdAt', { unique: false });
          docStore.createIndex('processingStatus', 'processingStatus', { unique: false });
        }

        // Chunks store
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunkStore.createIndex('documentId', 'documentId', { unique: false });
          chunkStore.createIndex('pageNumber', 'pageNumber', { unique: false });
        }

        // Flashcards store
        if (!db.objectStoreNames.contains('flashcards')) {
          const flashcardStore = db.createObjectStore('flashcards', { keyPath: 'id' });
          flashcardStore.createIndex('documentId', 'documentId', { unique: false });
          flashcardStore.createIndex('nextReviewDate', 'nextReviewDate', { unique: false });
        }

        // Study sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
        }

        // Citation bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bookmarkStore.createIndex('documentId', 'documentId', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  // Document operations
  async addDocument(doc: LocalDocument): Promise<string> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.add(doc);
      request.onsuccess = () => resolve(doc.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getDocument(id: string): Promise<LocalDocument | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllDocuments(): Promise<LocalDocument[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const index = store.index('createdAt');
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result.reverse());
      request.onerror = () => reject(request.error);
    });
  }

  async updateDocument(id: string, updates: Partial<LocalDocument>): Promise<void> {
    const db = await this.init();
    const doc = await this.getDocument(id);
    if (!doc) throw new Error('Document not found');

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.put({ ...doc, ...updates });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDocument(id: string): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['documents', 'chunks', 'flashcards', 'bookmarks'], 'readwrite');

      // Delete document
      const docStore = transaction.objectStore('documents');
      docStore.delete(id);

      // Delete all chunks for this document
      const chunkStore = transaction.objectStore('chunks');
      const chunkIndex = chunkStore.index('documentId');
      const chunkRequest = chunkIndex.openCursor(IDBKeyRange.only(id));
      chunkRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Delete flashcards
      const flashcardStore = transaction.objectStore('flashcards');
      const flashcardIndex = flashcardStore.index('documentId');
      const flashcardRequest = flashcardIndex.openCursor(IDBKeyRange.only(id));
      flashcardRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Delete bookmarks
      const bookmarkStore = transaction.objectStore('bookmarks');
      const bookmarkIndex = bookmarkStore.index('documentId');
      const bookmarkRequest = bookmarkIndex.openCursor(IDBKeyRange.only(id));
      bookmarkRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Chunk operations
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chunks'], 'readwrite');
      const store = transaction.objectStore('chunks');

      chunks.forEach(chunk => {
        store.add(chunk);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getChunksForDocument(documentId: string): Promise<DocumentChunk[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chunks'], 'readonly');
      const store = transaction.objectStore('chunks');
      const index = store.index('documentId');
      const request = index.getAll(IDBKeyRange.only(documentId));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getChunkForCitation(documentId: string, pageNumber: number, paragraphNumber: number): Promise<DocumentChunk | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chunks'], 'readonly');
      const store = transaction.objectStore('chunks');
      const index = store.index('documentId');
      const request = index.openCursor(IDBKeyRange.only(documentId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const chunk = cursor.value as DocumentChunk;
          if (chunk.pageNumber === pageNumber && chunk.paragraphNumber === paragraphNumber) {
            resolve(chunk);
            return;
          }
          cursor.continue();
        } else {
          resolve(undefined);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Flashcard operations with SM-2 algorithm
  async addFlashcard(flashcard: Flashcard): Promise<string> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['flashcards'], 'readwrite');
      const store = transaction.objectStore('flashcards');
      const request = store.add(flashcard);
      request.onsuccess = () => resolve(flashcard.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getFlashcardsDueForReview(): Promise<Flashcard[]> {
    const db = await this.init();
    const now = new Date();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['flashcards'], 'readonly');
      const store = transaction.objectStore('flashcards');
      const request = store.getAll();

      request.onsuccess = () => {
        const dueCards = request.result.filter(
          (card: Flashcard) => new Date(card.nextReviewDate) <= now
        );
        resolve(dueCards);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateFlashcardAfterReview(
    id: string,
    quality: 0 | 1 | 2 | 3 | 4 | 5
  ): Promise<void> {
    const db = await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['flashcards'], 'readwrite');
      const store = transaction.objectStore('flashcards');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const card = getRequest.result as Flashcard;

        // SM-2 Algorithm implementation
        const { easeFactor, interval, repetitions } = this.calculateSM2(
          card.easeFactor,
          card.interval,
          card.repetitions,
          quality
        );

        const now = new Date();
        const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

        const updatedCard: Flashcard = {
          ...card,
          easeFactor,
          interval,
          repetitions,
          lastReviewDate: now,
          nextReviewDate,
        };

        store.put(updatedCard);
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // SM-2 Algorithm implementation
  private calculateSM2(
    currentEaseFactor: number,
    currentInterval: number,
    currentRepetitions: number,
    quality: number
  ): { easeFactor: number; interval: number; repetitions: number } {
    let repetitions = currentRepetitions;
    let easeFactor = currentEaseFactor;
    let interval = currentInterval;

    if (quality >= 3) {
      // Successful recall
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      // Failed recall
      repetitions = 0;
      interval = 1;
    }

    // Update ease factor
    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );

    return { easeFactor, interval, repetitions };
  }

  async getAllFlashcards(): Promise<Flashcard[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['flashcards'], 'readonly');
      const store = transaction.objectStore('flashcards');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFlashcardsForDocument(documentId: string): Promise<Flashcard[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['flashcards'], 'readonly');
      const store = transaction.objectStore('flashcards');
      const index = store.index('documentId');
      const request = index.getAll(IDBKeyRange.only(documentId));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFlashcard(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['flashcards'], 'readwrite');
      const store = transaction.objectStore('flashcards');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Citation bookmarks
  async addBookmark(bookmark: CitationBookmark): Promise<string> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['bookmarks'], 'readwrite');
      const store = transaction.objectStore('bookmarks');
      const request = store.add(bookmark);
      request.onsuccess = () => resolve(bookmark.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getBookmarksForDocument(documentId: string): Promise<CitationBookmark[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['bookmarks'], 'readonly');
      const store = transaction.objectStore('bookmarks');
      const index = store.index('documentId');
      const request = index.getAll(IDBKeyRange.only(documentId));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Study sessions
  async addSession(session: StudySession): Promise<string> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.add(session);
      request.onsuccess = () => resolve(session.id);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSession(id: string, updates: Partial<StudySession>): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const session = getRequest.result;
        store.put({ ...session, ...updates });
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Export/Import for backup
  async exportData(): Promise<{
    documents: LocalDocument[];
    chunks: DocumentChunk[];
    flashcards: Flashcard[];
    bookmarks: CitationBookmark[];
    sessions: StudySession[];
  }> {
    const db = await this.init();

    const getData = (storeName: string): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    };

    const [documents, chunks, flashcards, bookmarks, sessions] = await Promise.all([
      getData('documents'),
      getData('chunks'),
      getData('flashcards'),
      getData('bookmarks'),
      getData('sessions'),
    ]);

    return { documents, chunks, flashcards, bookmarks, sessions };
  }

  async importData(data: {
    documents?: LocalDocument[];
    chunks?: DocumentChunk[];
    flashcards?: Flashcard[];
    bookmarks?: CitationBookmark[];
    sessions?: StudySession[];
  }): Promise<void> {
    const db = await this.init();

    const putData = async (storeName: string, items: any[]) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        items.forEach(item => store.put(item));
        transaction.oncomplete = () => resolve(undefined);
        transaction.onerror = () => reject(transaction.error);
      });
    };

    if (data.documents?.length) await putData('documents', data.documents);
    if (data.chunks?.length) await putData('chunks', data.chunks);
    if (data.flashcards?.length) await putData('flashcards', data.flashcards);
    if (data.bookmarks?.length) await putData('bookmarks', data.bookmarks);
    if (data.sessions?.length) await putData('sessions', data.sessions);
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    const db = await this.init();
    const storeNames = ['documents', 'chunks', 'flashcards', 'bookmarks', 'sessions'];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeNames, 'readwrite');
      storeNames.forEach(name => {
        transaction.objectStore(name).clear();
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Singleton instance
export const localDB = new LocalStorageDB();

// Export types
export type {
  LocalDocument,
  DocumentChunk,
  Flashcard,
  StudySession,
  CitationBookmark,
};
