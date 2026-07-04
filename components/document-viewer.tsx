"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  BookmarkPlus,
  BookOpen,
  X,
  ExternalLink,
  Clock,
  HardDrive,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { localDB, type LocalDocument, type CitationBookmark } from '@/lib/local-storage';
import { toast } from 'sonner';

// PDF.js is loaded dynamically in browser only
let pdfjsLib: any = null;

if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((mod) => {
    pdfjsLib = mod;
    mod.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${mod.version}/pdf.worker.min.js`;
  }).catch(() => {});
}

interface CitationLocation {
  pageNumber: number;
  paragraphNumber: number;
  text: string;
}

interface DocumentViewerProps {
  document: LocalDocument;
  citation?: CitationLocation;
  onClose?: () => void;
  onCitationClick?: (pageNumber: number, paragraphNumber: number) => void;
}

export function DocumentViewer({
  document,
  citation,
  onClose,
  onCitationClick,
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(citation?.pageNumber || 1);
  const [totalPages, setTotalPages] = useState(document.pageCount || 1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [pageText, setPageText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<CitationBookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Load bookmarks for this document
  useEffect(() => {
    const loadBookmarks = async () => {
      const docBookmarks = await localDB.getBookmarksForDocument(document.id);
      setBookmarks(docBookmarks);
    };
    loadBookmarks();
  }, [document.id]);

  // Navigate to citation if provided
  useEffect(() => {
    if (citation) {
      setCurrentPage(citation.pageNumber);
    }
  }, [citation]);

  // For PDF documents, we'd render the actual page
  // For now, we'll load the text content from chunks
  useEffect(() => {
    const loadPageContent = async () => {
      setIsLoading(true);
      try {
        const chunks = await localDB.getChunksForDocument(document.id);
        const pageChunks = chunks.filter(c => c.pageNumber === currentPage);
        setPageText(pageChunks.map(c => c.text).join('\n\n'));
      } catch (error) {
        console.error('Error loading page:', error);
        setPageText('Error loading page content.');
      }
      setIsLoading(false);
    };

    loadPageContent();
  }, [document.id, currentPage]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(p => p + 1);
    }
  };

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3.0));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation(r => (r + 90) % 360);

  const handleAddBookmark = async () => {
    const selectedText = window.getSelection()?.toString() || '';
    if (!selectedText) {
      toast.info('Select some text to bookmark.');
      return;
    }

    const bookmark: CitationBookmark = {
      id: crypto.randomUUID(),
      documentId: document.id,
      pageNumber: currentPage,
      paragraphNumber: 1, // Would be determined by selection
      text: selectedText.slice(0, 200),
      note: '',
      createdAt: new Date(),
    };

    await localDB.addBookmark(bookmark);
    setBookmarks(prev => [...prev, bookmark]);
    toast.success('Bookmark added!');
  };

  const handleNavigateToBookmark = (bookmark: CitationBookmark) => {
    setCurrentPage(bookmark.pageNumber);
    setShowBookmarks(false);
  };

  // Highlight citation text if present
  const highlightCitation = (text: string, citationText?: string): React.ReactNode => {
    if (!citationText) return text;

    const parts = text.split(new RegExp(`(${escapeRegExp(citationText.slice(0, 50))})`, 'i'));
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm truncate max-w-[200px]">
            {document.title}
          </span>
          <Badge variant="outline" className="text-xs">
            {document.fileType.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {/* Page navigation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Zoom */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-xs text-muted-foreground min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Rotate */}
          <Button variant="ghost" size="icon" onClick={handleRotate} className="h-8 w-8">
            <RotateCw className="h-4 w-4" />
          </Button>

          {/* Bookmark */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddBookmark}
            className="h-8 w-8"
          >
            <BookmarkPlus className="h-4 w-4" />
          </Button>

          {/* Bookmarks panel toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBookmarks(!showBookmarks)}
            className={cn("h-8 w-8", showBookmarks && "bg-primary/10")}
          >
            <BookOpen className="h-4 w-4" />
          </Button>

          {/* Close */}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document content */}
        <div
          className="flex-1 overflow-auto p-6"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'top left',
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse text-muted-foreground">Loading page...</div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {citation ? (
                <div>
                  <div className="flex items-center gap-2 mb-4 text-primary bg-primary/10 p-2 rounded">
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Citation: Page {citation.pageNumber}, Paragraph {citation.paragraphNumber}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {highlightCitation(pageText, citation.text)}
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{pageText}</div>
              )}
            </div>
          )}
        </div>

        {/* Bookmarks panel */}
        <AnimatePresence>
          {showBookmarks && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border overflow-hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Bookmarks ({bookmarks.length})
                  </h3>

                  {bookmarks.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No bookmarks yet.<br />
                      Select text and click the bookmark button.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((bookmark) => (
                        <button
                          key={bookmark.id}
                          onClick={() => handleNavigateToBookmark(bookmark)}
                          className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all"
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm line-clamp-2">{bookmark.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Page {bookmark.pageNumber}, Para {bookmark.paragraphNumber}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Document Library Component
interface DocumentLibraryProps {
  onSelectDocument: (document: LocalDocument) => void;
}

export function DocumentLibrary({ onSelectDocument }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      const docs = await localDB.getAllDocuments();
      setDocuments(docs);
      setIsLoading(false);
    };
    loadDocuments();
  }, []);

  const handleDelete = async (id: string) => {
    await localDB.deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.success('Document deleted');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Documents</h2>
        <Badge variant="secondary">{documents.length} documents</Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <HardDrive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents uploaded yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              All documents are stored locally on your device.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => onSelectDocument(doc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                      doc.fileType === 'pdf' ? "bg-red-500/10 text-red-500" :
                      doc.fileType === 'image' ? "bg-blue-500/10 text-blue-500" :
                      "bg-green-500/10 text-green-500"
                    )}>
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{doc.title}</h3>
                        {doc.processingStatus === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                        {doc.processingStatus === 'processing' && (
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                        )}
                        {doc.processingStatus === 'failed' && (
                          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(doc.size)}</span>
                        {doc.pageCount && <span>{doc.pageCount} pages</span>}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
