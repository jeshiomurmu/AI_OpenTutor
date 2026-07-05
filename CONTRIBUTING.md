# Contributing to AI OpenTutor

First off, thank you for considering contributing to AI OpenTutor! It's people like you that make this project a great tool for learners worldwide.

---

## 📜 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code:

### Our Standards

- **Be respectful** of differing viewpoints and experiences
- **Be graceful** in accepting constructive criticism
- **Be inclusive** and welcoming to newcomers
- **Be patient** with those learning new skills
- **Focus on what's best** for the community

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Publishing others' private information without permission
- Any conduct that would be inappropriate in a professional setting

---

## 🚀 Getting Started

### Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/ai-opentutor.git
cd ai-opentutor

# Add upstream remote
git remote add upstream https://github.com/original/ai-opentutor.git
```

### Keep Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## 💻 Development Setup

### Prerequisites

- Node.js 18+
- npm 9+ or pnpm 8+
- Git

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
# Required for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional - Supabase (for cloud features)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional - Clerk (for auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |

---

## 🏗️ Project Architecture

### Tech Stack

- **Framework**: Next.js 13 (App Router)
- **Language**: TypeScript 5.2
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Storage**: IndexedDB (local) + Supabase (optional cloud)
- **Document Processing**: PDF.js, Tesseract.js

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Chat UI     │  │  Document UI │  │  Flashcard UI│      │
│  │  (enhanced)   │  │  (viewer)    │  │  (review)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Tutor Engine     │  │  RAG Pipeline    │                │
│  │- Socratic logic  │  │- Chunking        │                │
│  │- Gap detection   │  │- Search          │                │
│  │- Misconceptions   │  │- Citations       │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ IndexedDB (local)│  │ Supabase (cloud) │                │
│  │- Documents       │  │- User profiles   │                │
│  │- Chunks          │  │- Conversations   │                │
│  │- Flashcards      │  │- Sync            │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/local-storage.ts` | IndexedDB wrapper, SM-2 algorithm |
| `lib/document-processor.ts` | PDF.js, Tesseract.js integration |
| `lib/enhanced-tutor.ts` | RAG + tutor mode orchestration |
| `lib/ai/tutor-intelligence.ts` | Cognitive engine with gap detection |
| `components/enhanced-tutor-chat.tsx` | Main chat UI component |
| `components/document-viewer.tsx` | PDF viewer with citations |

---

## 📏 Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define interfaces for all data structures
- Avoid `any` types - use `unknown` when type is uncertain
- Export types alongside implementations

```typescript
// Good
interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export function createFlashcard(data: Omit<Flashcard, 'id'>): Flashcard {
  // ...
}

// Avoid
function createFlashcard(data: any) {
  // ...
}
```

### React Components

- Use functional components with hooks
- Use `export` at the end of file
- Keep components under 300 lines
- Extract complex logic to custom hooks

```tsx
// Component structure
export function MyComponent({ prop }: MyComponentProps) {
  const [state, setState] = useState<string>('');
  
  // Hooks at the top
  useEffect(() => {
    // ...
  }, [prop]);
  
  // Event handlers
  const handleClick = useCallback(() => {
    // ...
  }, []);
  
  // Early returns
  if (!prop) return null;
  
  // JSX
  return (
    <div>...</div>
  );
}
```

### Styling

- Use Tailwind CSS classes
- Use `cn()` utility for conditional classes
- Follow mobile-first responsive design
- Use CSS variables for theming

```tsx
// Good
<div className={cn(
  "flex items-center gap-2",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />

// Avoid
<div style={{ display: 'flex', alignItems: 'center' }} />
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FlashcardViewer` |
| Functions | camelCase | `processDocument` |
| Constants | UPPER_SNAKE | `MAX_FILE_SIZE` |
| Files | kebab-case | `document-processor.ts` |
| Interfaces | PascalCase | `FlashcardData` |

### Comments

- Use self-documenting code
- Comment WHY, not WHAT
- Use JSDoc for public APIs

```typescript
// Good
// SM-2 algorithm calculates optimal interval based on performance
function calculateNextReview(easeFactor: number, interval: number): Date {
  // ...
}

// Avoid
// This function calculates the next review date
function calculateNextReview(easeFactor: number, interval: number): Date {
  // ...
}
```

---

## 📝 Commit Guidelines

### Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Maintenance |

### Examples

```bash
feat(tutor): add collaborative learning mode

- Implement real-time document sharing
- Add WebSocket connection for sync
- Create room management UI

Closes #123

fix(storage): resolve IndexedDB transaction deadlock

The previous implementation could cause a deadlock when
multiple tabs tried to access the database simultaneously.

Fixes #456

docs(readme): update installation instructions
```

---

## 🔄 Pull Request Process

### Before Submitting

1. **Update from main**
   ```bash
   git fetch upstream
   git merge upstream/main
   ```

2. **Run checks**
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

3. **Test your changes**
   - Verify functionality manually
   - Test on different screen sizes
   - Check for regressions

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested these changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### Review Process

1. At least one approval required
2. All CI checks must pass
3. Resolve all conversations
4. Squash and merge to main

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try with latest version
3. Clear browser cache/storage

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 14]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 20.10]

**Screenshots**
If applicable, add screenshots

**Additional Context**
Any other relevant information
```

---

## 💡 Feature Requests

### Before Requesting

1. Check existing issues/roadmap
2. Consider if it fits the project scope
3. Think about implementation complexity

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
What you want to happen

**Describe alternatives considered**
Other solutions you've thought about

**Use Case**
How would this feature be used?

**Additional Context**
Mockups, diagrams, or examples
```

---

## 📚 Documentation

### What to Document

- New features
- API changes
- Configuration options
- Breaking changes

### Documentation Structure

```
docs/
├── ARCHITECTURE.md    # System design
├── API.md             # API reference
├── LEARNING_SCIENCE.md # Methods used
├── DEPLOYMENT.md      # Deployment guide
└── images/            # Screenshots/diagrams
```

### Style Guide

- Use clear, simple language
- Include code examples
- Add screenshots for UI features
- Link to related documentation

---

## 🎯 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Discord**: (Coming soon)

---

## 🏆 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Community highlights

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AI OpenTutor! 🎉
