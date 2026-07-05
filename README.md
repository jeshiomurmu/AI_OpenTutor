# AI OpenTutor

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-gijd7ts7)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13.5-black)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<div align="center">
  
  # 🧠 AI OpenTutor
  
  <p align="center">
    <strong>A privacy-first AI tutor that learns from YOUR materials</strong>
    <br />
    <em>Local RAG • Grounded Citations • Evidence-Based Learning • Zero Cloud Dependency</em>
  </p>
  
  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-demo">Demo</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-documentation">Documentation</a> •
    <a href="CONTRIBUTING.md">Contributing</a>
  </p>
</div>

---

## 🎯 Why AI OpenTutor?

Unlike generic AI chatbots, AI OpenTutor is designed specifically for learning:

| Feature | AI OpenTutor | ChatGPT/Claude | Other Tutors |
|---------|--------------|----------------|--------------|
| Learn from YOUR docs | ✅ Local RAG | ❌ File upload | ⚠️ Limited |
| Privacy-first | ✅ 100% offline | ❌ Cloud required | ⚠️ Varies |
| Grounded Citations | ✅ [Page X, Para Y] | ❌ No citations | ❌ No |
| Socratic Learning | ✅ Guided discovery | ⚠️ On request | ⚠️ Limited |
| Self-Explanation | ✅ Built-in prompts | ❌ No | ❌ No |
| Knowledge Gap Detection | ✅ Automatic | ❌ No | ⚠️ Manual |
| Misconception Detection | ✅ Pre-built patterns | ❌ No | ❌ No |
| Spaced Repetition | ✅ SM-2 algorithm | ❌ No | ⚠️ External |

---

## ✨ Features

### 📚 Local-First RAG (Retrieval Augmented Generation)
- Upload PDFs, images, and text documents
- All processing happens locally on your device
- No data ever leaves your browser
- Works completely offline

### 🎯 Grounded Citations
- Every AI response cites your source materials
- Citations include page and paragraph numbers: `[Page 12, Para 3]`
- Click citations to jump directly to the source

### 🧠 Evidence-Based Learning
- **Socratic Mode**: Discover answers through guided questions
- **Self-Explanation Prompts**: Active recall after each response
- **Knowledge Gap Detection**: Identifies what you don't know you don't know
- **Misconception Correction**: Catches and corrects common misunderstandings

### 📝 Smart Study Tools
- **Flashcard Generation**: Automatically extract Q&A from documents
- **SM-2 Spaced Repetition**: Optimal review scheduling
- **Quiz Mode**: Test your knowledge with explanations

### 🔒 Privacy & Offline
- 100% local processing with IndexedDB storage
- No account required for basic features
- Offline/online toggle for flexibility

---

## 📸 Demo Screenshots

> **Note**: The screenshots below are placeholders. To capture actual screenshots, run `npm run dev` and take screenshots using your browser's developer tools or a screenshot tool.

### Authentication & Dashboard
**File**: `docs/images/auth-page.png`

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 AI Tutor                                    [Sign In]    │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────┐    │
│  │                     │    │  [Sign In] [Sign Up]    │    │
│  │  Learn Smarter      │    │                         │    │
│  │  with AI            │    │  Email: ____________    │    │
│  │                     │    │  Password: ___________  │    │
│  │  • Socratic Learning│    │                         │    │
│  │  • Knowledge Gaps   │    │  [Sign In]              │    │
│  │  • Problem Breakdown│    │                         │    │
│  │  • Misconceptions   │    └─────────────────────────┘    │
│  └─────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```
*The clean sign-in page with feature highlights and a modern auth form.*

### Document Upload
**File**: `docs/images/upload-modal.png`

*Drag and drop any PDF, image, or text file. Processing happens locally with real-time progress.*

### Socratic Learning Mode
**File**: `docs/images/socratic-mode.png`

*The tutor guides you to discover answers rather than giving them directly.*

### Grounded Citations
**File**: `docs/images/citations.png`

*Every answer includes clickable citations like `[Page 12, Para 3]` that reference your materials.*

### Self-Explanation Feedback
**File**: `docs/images/self-explanation.png`

*Explain concepts in your own words and get detailed feedback with accuracy scoring.*

### Flashcard Review
**File**: `docs/images/flashcards.png`

*Review flashcards with spaced repetition. Flip cards and rate your understanding (Again/Hard/Good/Easy).*

### Quiz Mode
**File**: `docs/images/quiz.png`

*Test your knowledge with multiple choice questions and explanations.*

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-opentutor.git
cd ai-opentutor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
# Supabase (optional - for cloud sync)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Clerk (optional - for auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

> **Note**: The app works without these for local-only mode!

### Build for Production

```bash
npm run build
npm start
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/ARCHITECTURE.md) | System design and components |
| [API Reference](docs/API.md) | Component and function documentation |
| [Learning Science](docs/LEARNING_SCIENCE.md) | Evidence-based methods used |
| [Deployment Guide](docs/DEPLOYMENT.md) | Deploy to production |
| [Contributing](CONTRIBUTING.md) | How to contribute |

---

## 🏗️ Project Structure

```
ai-opentutor/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Main dashboard
│   ├── flashcards/        # Flashcard review page
│   └── quiz/              # Quiz page
├── components/            # React components
│   ├── enhanced-tutor-chat.tsx  # Main chat interface
│   ├── document-viewer.tsx      # PDF viewer with citations
│   ├── upload-modal.tsx         # File upload modal
│   └── ui/                       # shadcn/ui components
├── lib/                   # Core libraries
│   ├── local-storage.ts   # IndexedDB wrapper + SM-2
│   ├── document-processor.ts  # PDF/OCR processing
│   ├── enhanced-tutor.ts  # RAG + tutor logic
│   └── ai/
│       └── tutor-intelligence.ts  # Cognitive engine
├── docs/                  # Documentation
└── supabase/              # Database migrations
```

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run build to verify
npm run build
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code of conduct
- Development setup
- Pull request guidelines
- Coding standards

### Ways to Contribute
- 🐛 Report bugs via [Issues](https://github.com/yourusername/ai-opentutor/issues)
- 💡 Request features
- 📖 Improve documentation
- 🔧 Submit pull requests

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF processing
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Supabase](https://supabase.com/) for optional backend
- The learning science community for evidence-based techniques

---

## 📊 Roadmap

- [ ] Semantic search with local embeddings (Transformers.js)
- [ ] Multi-language support
- [ ] Collaborative study groups
- [ ] Mobile app (React Native)
- [ ] Anki export for flashcards
- [ ] Voice interaction
- [ ] LaTeX formula support in flashcards

---

<div align="center">
  <p>Made with ❤️ for learners everywhere</p>
  <p>
    <a href="https://github.com/yourusername/ai-opentutor/stargazers">
      <img src="https://img.shields.io/github/stars/yourusername/ai-opentutor?style=social" alt="Star us on GitHub">
    </a>
  </p>
</div>
