# Changelog

All notable changes to AI OpenTutor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

#### Core Features
- **Local-First RAG System**: Upload PDFs, images, and text documents for AI-powered Q&A
- **Four Tutor Modes**: Socratic, Guided, Direct, and Problem Solver modes
- **Grounded Citations**: Every answer cites specific pages and paragraphs from your documents
- **Self-Explanation Prompts**: Active recall exercises after each response
- **Knowledge Gap Detection**: Identifies missing, weak, or misunderstood concepts
- **Misconception Detection**: Pre-built patterns to catch common errors

#### Study Tools
- **Flashcard Generation**: Automatically extract Q&A pairs from documents
- **SM-2 Spaced Repetition**: Optimal review scheduling algorithm
- **Quiz Mode**: Multiple choice questions with explanations

#### Privacy & Offline
- **100% Local Processing**: All document processing happens in browser
- **IndexedDB Storage**: No cloud dependency for core features
- **Offline/Online Toggle**: Switch between local and cloud modes

#### Technical
- PDF.js integration for PDF text extraction
- Tesseract.js for image OCR
- Dynamic imports for SSR compatibility
- Responsive design for all screen sizes

### Technical Details

#### Dependencies
- Next.js 13.5 with App Router
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui
- Zustand for state management
- PDF.js 6.1 for PDF processing
- Tesseract.js 7.0 for OCR
- Framer Motion for animations

#### File Structure
```
ai-opentutor/
├── app/                    # Next.js pages
├── components/             # React components
├── lib/                    # Core libraries
│   ├── local-storage.ts    # IndexedDB + SM-2
│   ├── document-processor.ts # PDF/OCR
│   ├── enhanced-tutor.ts   # RAG + tutor
│   └── ai/                  # Intelligence
└── docs/                   # Documentation
```

---

## [0.9.0] - 2024-01-01

### Added
- Initial beta release
- Basic chat functionality
- Document upload
- Simple RAG implementation

### Changed
- Migrated to App Router
- Improved performance

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2024-01-15 | Full release with all features |
| 0.9.0 | 2024-01-01 | Beta release |

---

## Upcoming Features

### [1.1.0] - Planned

- Semantic search with local embeddings (Transformers.js)
- Multi-language support
- Anki export for flashcards
- Voice interaction
- LaTeX formula support

### [1.2.0] - Planned

- Collaborative study groups (WebRTC)
- Mobile app (React Native)
- Browser extension
- API for developers

---

## Migration Guides

### Upgrading to 1.0.0

If upgrading from beta:

1. Clear IndexedDB data (breaking changes)
2. Delete `node_modules` and reinstall
3. Update environment variables
4. Re-upload documents

```bash
# Clear local data
# Open DevTools → Application → IndexedDB → Delete 'ai-tutor-local'

# Reinstall
rm -rf node_modules
npm install
```
