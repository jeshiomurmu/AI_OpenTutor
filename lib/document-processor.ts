// Document Processing Pipeline
// PDF extraction, chunking, and OCR - all local processing

import { localDB, type DocumentChunk, type LocalDocument } from './local-storage';

// Dynamic imports for browser-only libraries
let pdfjsLib: any = null;
let Tesseract: any = null;

if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((mod) => {
    pdfjsLib = mod;
    mod.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.js`;
  }).catch(() => {});
  import('tesseract.js').then((mod) => {
    Tesseract = mod;
  }).catch(() => {});
}

export interface ProcessingProgress {
  stage: 'loading' | 'extracting' | 'chunking' | 'embedding' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  paragraphNumber: number;
  text: string;
  chunkId: string;
}

export interface RAGResult {
  answer: string;
  citations: Citation[];
  confidence: number;
}

// Text chunker with overlap for better retrieval
class TextChunker {
  private chunkSize: number;
  private overlap: number;

  constructor(chunkSize = 500, overlap = 100) {
    this.chunkSize = chunkSize;
    this.overlap = overlap;
  }

  chunk(text: string, pageNumber: number): Array<{
    text: string;
    paragraphNumber: number;
    startOffset: number;
    endOffset: number;
  }> {
    const chunks: Array<{
      text: string;
      paragraphNumber: number;
      startOffset: number;
      endOffset: number;
    }> = [];

    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    let currentOffset = 0;
    let paragraphNumber = 1;

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) {
        currentOffset += paragraph.length + 2;
        continue;
      }

      // If paragraph is too long, split into chunks
      if (trimmedParagraph.length > this.chunkSize) {
        const subChunks = this.splitIntoOverlappingChunks(trimmedParagraph, currentOffset);
        subChunks.forEach((subChunk) => {
          chunks.push({
            text: subChunk.text,
            paragraphNumber,
            startOffset: subChunk.startOffset,
            endOffset: subChunk.endOffset,
          });
        });
      } else {
        chunks.push({
          text: trimmedParagraph,
          paragraphNumber,
          startOffset: currentOffset,
          endOffset: currentOffset + trimmedParagraph.length,
        });
      }

      currentOffset += paragraph.length + 2;
      paragraphNumber++;
    }

    return chunks;
  }

  private splitIntoOverlappingChunks(
    text: string,
    startOffset: number
  ): Array<{ text: string; startOffset: number; endOffset: number }> {
    const chunks: Array<{ text: string; startOffset: number; endOffset: number }> = [];
    let position = 0;

    while (position < text.length) {
      const endPosition = Math.min(position + this.chunkSize, text.length);
      const chunkText = text.slice(position, endPosition);

      // Try to break at sentence boundary
      const lastPeriod = chunkText.lastIndexOf('.');
      const adjustedEnd = lastPeriod > position + this.chunkSize * 0.5 ? lastPeriod + 1 : endPosition;

      chunks.push({
        text: text.slice(position, adjustedEnd),
        startOffset: startOffset + position,
        endOffset: startOffset + adjustedEnd,
      });

      position = adjustedEnd - this.overlap;
      if (position <= chunks[chunks.length - 1]?.startOffset - startOffset) {
        position = adjustedEnd;
      }
    }

    return chunks;
  }
}

// PDF Processor using PDF.js
export class PDFProcessor {
  private chunker: TextChunker;
  private onProgress?: (progress: ProcessingProgress) => void;

  constructor(onProgress?: (progress: ProcessingProgress) => void) {
    this.chunker = new TextChunker();
    this.onProgress = onProgress;
  }

  async processPDF(
    file: File,
    documentId: string
  ): Promise<{ chunks: DocumentChunk[]; pageCount: number; text: string }> {
    // Check if PDF.js is loaded
    if (!pdfjsLib) {
      const mod = await import('pdfjs-dist');
      mod.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.js`;
      pdfjsLib = mod;
    }

    const arrayBuffer = await file.arrayBuffer();

    this.reportProgress('loading', 0, 'Loading PDF...');

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const allChunks: DocumentChunk[] = [];
    let fullText = '';
    let chunkIndex = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      this.reportProgress(
        'extracting',
        (pageNum / numPages) * 50,
        `Extracting page ${pageNum} of ${numPages}...`
      );

      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n\n';

      // Chunk the page text
      const pageChunks = this.chunker.chunk(pageText, pageNum);
      pageChunks.forEach((chunk) => {
        allChunks.push({
          id: `${documentId}-chunk-${chunkIndex++}`,
          documentId,
          chunkIndex: chunkIndex - 1,
          pageNumber: pageNum,
          paragraphNumber: chunk.paragraphNumber,
          text: chunk.text,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
        });
      });
    }

    this.reportProgress('chunking', 75, 'Organizing content...');

    // Store chunks in IndexedDB
    await localDB.addChunks(allChunks);

    this.reportProgress('complete', 100, 'Processing complete!');

    return {
      chunks: allChunks,
      pageCount: numPages,
      text: fullText,
    };
  }

  private reportProgress(
    stage: ProcessingProgress['stage'],
    progress: number,
    message: string
  ): void {
    if (this.onProgress) {
      this.onProgress({ stage, progress, message });
    }
  }
}

// Image OCR Processor using Tesseract.js
export class OCRProcessor {
  private onProgress?: (progress: ProcessingProgress) => void;

  constructor(onProgress?: (progress: ProcessingProgress) => void) {
    this.onProgress = onProgress;
  }

  async processImage(
    file: File,
    documentId: string
  ): Promise<{ text: string; chunks: DocumentChunk[] }> {
    // Load Tesseract.js on demand
    if (!Tesseract) {
      Tesseract = await import('tesseract.js');
    }

    this.reportProgress('extracting', 0, 'Initializing OCR engine...');

    const result = await Tesseract.recognize(file, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          this.reportProgress(
            'extracting',
            m.progress * 100,
            'Recognizing text from image...'
          );
        }
      },
    });

    const text = result.data.text;

    // Create a single chunk for the image
    const chunk: DocumentChunk = {
      id: `${documentId}-chunk-0`,
      documentId,
      chunkIndex: 0,
      pageNumber: 1,
      paragraphNumber: 1,
      text,
      startOffset: 0,
      endOffset: text.length,
    };

    await localDB.addChunks([chunk]);

    this.reportProgress('complete', 100, 'OCR complete!');

    return { text, chunks: [chunk] };
  }

  private reportProgress(
    stage: ProcessingProgress['stage'],
    progress: number,
    message: string
  ): void {
    if (this.onProgress) {
      this.onProgress({ stage, progress, message });
    }
  }
}

// Document Manager - orchestrates processing
export class DocumentManager {
  private pdfProcessor: PDFProcessor | null = null;
  private ocrProcessor: OCRProcessor | null = null;

  async processDocument(
    file: File,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<LocalDocument> {
    const documentId = crypto.randomUUID();
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    const doc: LocalDocument = {
      id: documentId,
      title: file.name.replace(/\.[^/.]+$/, ''),
      filename: file.name,
      fileType: isPDF ? 'pdf' : isImage ? 'image' : 'text',
      size: file.size,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      processingStatus: 'processing',
      processingProgress: 0,
    };

    await localDB.addDocument(doc);

    try {
      if (isPDF) {
        this.pdfProcessor = new PDFProcessor(onProgress);
        const result = await this.pdfProcessor.processPDF(file, documentId);
        await localDB.updateDocument(documentId, {
          pageCount: result.pageCount,
          processingStatus: 'completed',
          processingProgress: 100,
        });
      } else if (isImage) {
        this.ocrProcessor = new OCRProcessor(onProgress);
        await this.ocrProcessor.processImage(file, documentId);
        await localDB.updateDocument(documentId, {
          processingStatus: 'completed',
          processingProgress: 100,
        });
      } else {
        // Plain text file
        const text = await file.text();
        const chunker = new TextChunker();
        const chunks = chunker.chunk(text, 1);
        const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
          id: `${documentId}-chunk-${index}`,
          documentId,
          chunkIndex: index,
          pageNumber: 1,
          paragraphNumber: chunk.paragraphNumber,
          text: chunk.text,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
        }));
        await localDB.addChunks(documentChunks);
        await localDB.updateDocument(documentId, {
          processingStatus: 'completed',
          processingProgress: 100,
        });
      }

      return (await localDB.getDocument(documentId))!;
    } catch (error) {
      await localDB.updateDocument(documentId, {
        processingStatus: 'failed',
        processingProgress: 0,
      });
      throw error;
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    await localDB.deleteDocument(documentId);
  }

  async getAllDocuments(): Promise<LocalDocument[]> {
    return localDB.getAllDocuments();
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    return localDB.getChunksForDocument(documentId);
  }
}

// Simple keyword-based search (can be upgraded to semantic search later)
export class LocalSearch {
  async search(
    query: string,
    documentIds?: string[]
  ): Promise<Array<DocumentChunk & { score: number }>> {
    const allChunks = documentIds
      ? (await Promise.all(documentIds.map(id => localDB.getChunksForDocument(id)))).flat()
      : [];

    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    const scored = allChunks.map(chunk => {
      const textLower = chunk.text.toLowerCase();
      let score = 0;

      queryTerms.forEach(term => {
        const regex = new RegExp(term, 'gi');
        const matches = textLower.match(regex);
        if (matches) {
          score += matches.length * (term.length / queryTerms.length);
        }
      });

      return { ...chunk, score };
    });

    return scored
      .filter(chunk => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  // Build a RAG context from retrieved chunks
  async buildRAGContext(
    query: string,
    documentIds?: string[],
    maxTokens: number = 2000
  ): Promise<{ context: string; citations: Citation[] }> {
    const results = await this.search(query, documentIds);

    let context = '';
    let tokenCount = 0;
    const citations: Citation[] = [];

    for (const chunk of results) {
      const chunkTokens = chunk.text.split(/\s+/).length;
      if (tokenCount + chunkTokens > maxTokens) break;

      context += `[Page ${chunk.pageNumber}, Para ${chunk.paragraphNumber}]: ${chunk.text}\n\n`;
      tokenCount += chunkTokens;

      // We'll need the document title - for now use chunk info
      citations.push({
        documentId: chunk.documentId,
        documentTitle: 'Document',
        pageNumber: chunk.pageNumber,
        paragraphNumber: chunk.paragraphNumber,
        text: chunk.text.slice(0, 150) + (chunk.text.length > 150 ? '...' : ''),
        chunkId: chunk.id,
      });
    }

    return { context, citations };
  }
}

// Format citation for display
export function formatCitation(citation: Citation): string {
  return `[Page ${citation.pageNumber}, Para ${citation.paragraphNumber}]`;
}

// Export singleton instances
export const documentManager = new DocumentManager();
export const localSearch = new LocalSearch();
