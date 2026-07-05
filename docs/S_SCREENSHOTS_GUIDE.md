# Screenshot Guide for AI OpenTutor

This guide explains how to capture the screenshots referenced in the README.

## Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   Navigate to `http://localhost:3000`

3. **Browser setup:**
   - Use Chrome or Firefox
   - Set window size to 1440x900 or larger for consistent screenshots
   - Use dark mode for best visual appearance

---

## Screenshots to Capture

### 1. Hero/Auth Page
**File**: `docs/images/auth-page.png`

**How to capture:**
1. Open `http://localhost:3000` (not signed in)
2. Set browser width to 1440px
3. Use screenshot tool to capture full viewport

**What to include:**
- Full sign-in/sign-up page
- Feature cards on the left
- Auth form on the right

### 2. Upload Modal
**File**: `docs/images/upload-modal.png`

**How to capture:**
1. Sign in to the app
2. Click the Upload button (cloud icon) in sidebar
3. Capture the modal dialog

**What to include:**
- Drag & drop zone
- Supported file types text
- Upload progress (optional - you can drag a file in)

### 3. Socratic Mode Chat
**File**: `docs/images/socratic-mode.png`

**How to capture:**
1. Ensure "Socratic" mode is selected in top bar
2. Type a question like "What is quantum superposition?"
3. Wait for the response
4. Capture the conversation

**What to include:**
- Mode selector showing "Socratic"
- User question
- AI response with guiding questions
- Citations if available

### 4. Citations Display
**File**: `docs/images/citations.png`

**How to capture:**
1. Upload a PDF document first
2. Ask a question about the document
3. Wait for response with citations
4. Capture the message with citation badges

**What to include:**
- AI response
- Citation badges like `[Page 12, Para 3]`
- Orange/badge styling

### 5. Self-Explanation Prompt
**File**: `docs/images/self-explanation.png`

**How to capture:**
1. After getting an AI response in Socratic mode
2. Wait for the self-explanation prompt to appear
3. Type a brief explanation
4. Submit and capture the feedback

**What to include:**
- Self-explanation prompt box
- Your typed explanation
- Feedback with score (percentage)
- Accurate/missing concepts badges

### 6. Flashcard Review
**File**: `docs/images/flashcards.png`

**How to capture:**
1. Navigate to `/flashcards` (use sidebar link)
2. Capture before flipping (question side)
3. Capture after flipping (answer side)

**What to include:**
- Flashcard with question
- Difficulty badge (easy/medium/hard)
- Tags
- Rating buttons (Again, Hard, Good, Easy)
- Progress bar

### 7. Quiz Mode
**File**: `docs/images/quiz.png`

**How to capture:**
1. Navigate to `/quiz` (use sidebar link)
2. Capture question with multiple choice options
3. Select an answer
4. Capture the explanation popup

**What to include:**
- Question text
- Multiple choice options
- Difficulty badge
- Explanation panel

---

## Tools for Screenshots

### Browser Built-in
- **Chrome**: DevTools → More tools → Screenshot
- **Firefox**: Right-click → Take Screenshot

### OS Tools
- **macOS**: Cmd+Shift+4 (selection), Cmd+Shift+3 (full screen)
- **Windows**: Snipping Tool (Win+Shift+S)
- **Linux**: `gnome-screenshot` or Spectacle

### Extensions
- [Awesome Screenshot](https://www.awesomescreenshot.com/) - Full page captures
- [Lightshot](https://app.prntscr.com/) - Quick annotations

---

## Image Guidelines

1. **Format**: PNG (for crisp text)
2. **Width**: 1200-1400px for good quality
3. **File size**: Keep under 500KB each
4. **Naming**: Use lowercase with hyphens (`upload-modal.png`)

### Optimization

After capturing, optimize images:

```bash
# Using imagemagick
convert original.png -resize 1400x -quality 85 docs/images/output.png

# Or use online tools like:
# - https://squoosh.app
# - https://tinypng.com
```

---

## Adding Screenshots to README

After capturing, place images in `docs/images/` and the README will reference them:

```
docs/images/
├── auth-page.png
├── upload-modal.png
├── socratic-mode.png
├── citations.png
├── self-explanation.png
├── flashcards.png
└── quiz.png
```

The README uses relative paths like:
```markdown
![Auth Page](docs/images/auth-page.png)
```

---

## Quick Commands

```bash
# Create images directory
mkdir -p docs/images

# Check image dimensions
file docs/images/*.png

# Optimize all PNGs (requires optipng)
optipng -o5 docs/images/*.png
```
