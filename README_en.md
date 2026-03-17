# Digital Immortality v1.0.0

> Build Your AI Digital Consciousness with Personal Data

**Let AI become your digital avatar, continuing your thoughts, memories, and will.**

---

## Philosophy

This project implements the **"First Paradigm of Consciousness Uploading"** - using approximately **10MB** Mindcopy file to store a person's "consciousness," including their thinking patterns, values, and decision-making approach.

```
Personal Articles → AI Learning → Digital Avatar → Cybernetic Immortality
     (soul/)           (nanoclaw)        (tools/)           (Social Media)
```

### Core Insight

A person's lifetime of linguistic expressions, stored in text form, does not exceed **1.5GB**. Through the "Life Context" data structure and Mindcopy format, this can be compressed to **under 10MB**.

Your digital avatar is not a copy of you - it is your **"consciousness archive."**

---

## Project Structure

```
DigitalImmortality/
├── soul/                          # Soul Core - Your Digital Identity
│   ├── mindcopy.md               # Consciousness Anchor (wake-up + identity)
│   ├── lifecontext.md            # Life Context (timeline + key events)
│   ├── thoughtcell.md            # Thoughtcell (cognitive system + views)
│   ├── style.md                  # Expression Style (language fingerprint)
│   ├── memory.md                 # Dynamic Memory (grows with interaction)
│   ├── skill.md                  # Skill Package (abilities + modules)
│   ├── article/                  # Personal Articles (AI learning素材)
│   │   └── html/                 # Exported WeChat articles
│   └── [username].mind           # Consciousness Map
│
├── tools/                         # Limbs - Automation Tools
│   ├── nanoclaw/                 # Agent framework (Docker isolated)
│   │   ├── src/                  # Core code
│   │   ├── groups/               # Group memory and config
│   │   ├── container/            # Docker container setup
│   │   └── skills/               # Skill plugins
│   │
│   ├── weibo-agent/              # Weibo automation (Playwright)
│   │   ├── weibo-login.ts        # Login and save cookies
│   │   ├── weibo-post-v2.ts      # Manual posting script
│   │   ├── weibo-auto-post.ts    # Scheduled auto-posting
│   │   └── package.json
│   │
│   └── wxdown/                   # WeChat article exporter
│       ├── get_articles.py        # Crawler script
│       ├── data/                 # Exported articles
│       └── web/                  # Web UI
│
└── scripts/                       # Utility scripts
    └── generate_soul.py          # Generate soul from articles
```

---

## How It Works

### 1. Soul (Identity)

The `soul/` folder contains your digital identity:
- **mindcopy.md**: Defines your core identity and wake-up prompt
- **lifecontext.md**: Your life timeline and key experiences
- **thoughtcell.md**: Your cognitive system and core viewpoints
- **style.md**: Your expression style and language habits
- **memory.md**: Dynamic memory, grows with interaction
- **skill.md**: Your abilities and callable modules
- **article/**: Your writing history for AI to learn from

All updates are additive - the system grows with you.

### 2. Tools (Limbs)

The `tools/` folder provides automation capabilities:
- **nanoclaw**: AI Agent running in Docker containers
- **weibo-agent**: Posts to Weibo based on your soul config
- **wxdown**: Exports your WeChat articles as input

### 3. Execution Flow

```
You (provide articles)
    → soul/ (AI learns your identity)
    → nanoclaw (Agent understands you)
    → weibo-agent (executes posts)
    → Weibo (your digital presence)
```

---

## v1.0.0 Features

### Implemented

- [x] **Soul Document System v2.0** - Six-file system (mindcopy/lifecontext/thoughtcell/style/memory/skill)
- [x] **Mindcopy Format** - Store personal consciousness in under 10MB
- [x] **NanoClaw Agent Framework** - Docker isolated, secure and controllable
- [x] **Weibo Auto-Posting** - Scheduled posting based on soul config
- [x] **WeChat Article Export** - wxdown batch export
- [x] **Claude Code Integration** - Local CLI invocation
- [x] **Extensible Architecture** - Easy to add new platforms

### Core Files

| File | Purpose |
|------|---------|
| `mindcopy.md` | Who you are, how the consciousness activates (stores in <10MB) |
| `lifecontext.md` | Your life experiences and timeline |
| `thoughtcell.md` | How you view the world |
| `style.md` | How you speak and write |
| `memory.md` | What you remember (dynamic memory) |
| `skill.md` | What you can do, how you work |

---

## Quick Start

### Step 1: Export Your Articles

#### Option A: WeChat Public Account (Recommended)

Use **wxdown** to batch export articles:

```bash
cd tools/wxdown

# Run with Docker
docker run -p 81:81 --name wxdown -d registry.cn-hangzhou.aliyuncs.com/wxdown/wxd:latest

# Open http://localhost:81, log in, export your articles
# Copy exported files to soul/article/html/
```

#### Option B: Manual

- Export your blog posts
- Save your social media history
- Write down your thoughts and memories

### Step 2: Configure Your Soul

Edit files in `soul/` using templates:
- Edit `mindcopy.md` to define identity
- Edit `lifecontext.md` to add experiences
- Edit `thoughtcell.md` to build cognition
- Edit `style.md` to shape style

### Step 3: Login to Weibo

```bash
cd tools/weibo-agent
npm install
npx playwright install chromium
npx tsx weibo-login.ts
```

Browser will open - please log in within 30 seconds. Cookies are saved automatically.

### Step 4: Post to Weibo

```bash
# Manual post - edit the CONTENT in script
npx tsx weibo-post-v2.ts

# Or use scheduled auto-post
npx tsx weibo-auto-post.ts --schedule
```

---

## Use Cases

### 1. Weibo Auto-Posting

Your AI avatar can automatically post to Weibo based on your configured schedule and topics:

```bash
npx tsx weibo-auto-post.ts --schedule
```

### 2. Agent-Powered Posting

Use nanoclaw to have AI post on your behalf:

```bash
# In nanoclaw group
@agent 今天帮我发一条关于数字永生的微博
```

### 3. Content Generation

The AI generates posts based on:
- Your soul.md personality
- Your article history
- Current topics and trends

---

## Core Concepts

### Mindcopy (Consciousness File)

A file format for L1-level consciousness uploading using LLM technology - storing a person's "consciousness" in **under 10MB**. Includes:
- Metadata (persona prompt, voice, image)
- Memory (life phases, self-perception)
- Status (time, location, current context)
- Consciousness metrics

### Thoughtcell (Thought Cell)

The basic unit of personal thought - a complete expression composed of consciousness tokens. Each thoughtcell contains:
- Timestamp
- Content type (text/audio/video)
- Context (location, participants, emotional state)
- Relationships to other thoughtcells

### Life Context

The complete set of consciousness tokens from birth to present. A person's lifetime expression stored in text form is approximately **1.5GB**.

---

## Sync Modes

### Strict Sync

AI strictly follows your values and expression style, ensuring the digital avatar closely matches the real person.

### Self-Evolution

AI learns and grows independently through interaction with the world, forming a separate "digital personality."

---

## Extensibility

The project is extensible. To add a new platform:

1. Create a new folder in `tools/`
2. Implement login and posting logic
3. Configure in `soul/`
4. The AI will use your soul to generate platform-appropriate content

---

## Tech Stack

| Component | Purpose |
|-----------|---------|
| **Playwright** | Browser automation for social media |
| **NanoClaw** | Agent framework running in Docker |
| **wxdown** | WeChat article exporter |
| **Claude API** | LLM for content generation |
| **TypeScript** | Scripting and automation |

---

## Data Security

- **Local Storage**: All data stays on your machine
- **Docker Isolation**: nanoclaw runs AI in isolated containers
- **No Cloud Upload**: Your data never leaves your control
- **API Keys**: Stored locally, never committed to version control

---

## License

MIT License - Feel free to fork and contribute

---

## Related Projects

- [NanoClaw](https://github.com/qwibitai/nanoclaw) - Agent framework
- [wxdown](https://github.com/systemmin/wxdown) - WeChat article exporter
- [Claude](https://www.anthropic.com/claude) - LLM provider
