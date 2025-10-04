# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Using Gemini for Large Codebase Analysis

**PRIORITY ORDER - ALWAYS CHECK IN THIS ORDER:**

1. **First**: Check if Gemini MCP is available and use it
2. **Second**: Use Gemini CLI (`gemini -p`) to leverage Google Gemini's large context capacity  
3. **Last Resort Only**: Use backup Gemini API client (only when both above fail)

When analyzing large codebases or multiple files that might exceed context limits, follow this priority order.

## Backup Gemini API Client

**When @google/gemini-cli quota is exceeded**, use the custom backup client with your own Google Cloud project:

### Setup Complete ✅
- **Project ID**: `136334456295` 
- **API Key**: Configured and tested
- **Model**: `gemini-2.5-pro` (default)
- **Custom Client**: `gemini-api-client.js` with @google/generative-ai SDK
- **Backup Script**: `./gemini-backup.sh` for easy usage

### Usage Examples:

**Using the backup script:**
```bash
./gemini-backup.sh "Analyze this codebase for patterns"
./gemini-backup.sh "@LangTutor/ApplePayManager.swift Fix compilation errors"
```

**Direct Node.js usage:**
```bash
GOOGLE_CLOUD_PROJECT=136334456295 node gemini-api-client.js "@src/ Analyze architecture"
```

**When to Use Backup:**
- When `gemini -p` returns 429 quota exceeded errors
- For extended analysis sessions that exceed daily limits
- When you need guaranteed access to Gemini API

The backup client supports the same `@file` inclusion syntax and provides usage statistics.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the gemini command:

### Examples:

**Single file analysis:**
```bash
gemini -p "@src/main.py Explain this file's purpose and structure"
```

**Multiple files:**
```bash
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"
```

**Entire directory:**
```bash
gemini -p "@src/ Summarize the architecture of this codebase"
```

**Multiple directories:**
```bash
gemini -p "@src/ @tests/ Analyze test coverage for the source code"
```

**Current directory and subdirectories:**
```bash
gemini -p "@./ Give me an overview of this entire project"
```

**Or use --all_files flag:**
```bash
gemini --all_files -p "Analyze the project structure and dependencies"
```

### Implementation Verification Examples

**Check if a feature is implemented:**
```bash
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"
```

**Verify authentication implementation:**
```bash
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"
```

**Check for specific patterns:**
```bash
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"
```

**Verify error handling:**
```bash
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"
```

**Check for rate limiting:**
```bash
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"
```

**Verify caching strategy:**
```bash
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"
```

**Check for specific security measures:**
```bash
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"
```

**Verify test coverage for features:**
```bash
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"
```

## Token Efficiency for Project Documentation Updates

**CRITICAL: Use Gemini CLI for ALL project-tasks.mdc updates and avoid token-heavy manual TODO completion tracking. The Gemini CLI should handle the entire documentation process efficiently without Claude intervention.**

When updating project-tasks.mdc with completed work:
- Use Gemini CLI for 100% of project-tasks.mdc updates
- Do NOT manually track TODO completion status 
- Let Gemini CLI handle entire documentation process
- Avoid using excessive Claude Code tokens for documentation tasks
- Use gemini CLI for context analysis and direct edits
- Be maximally efficient with token usage for project updates

## Gemini CLI/API Failure Polcdicy

**IMPORTANT**: If Gemini API or Gemini CLI fails, NEVER continue manually unless explicitly told to do so by the user. Always stop and wait for user instructions when Gemini tools are unavailable.

### When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase
- Always use gemini cli or gemini api for Read( commands

### Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results

## Project Overview

DuoVibes is a comprehensive language learning iOS app with Node.js/Express backend. The project consists of:

- **iOS App** (`/LangTutor/`): SwiftUI-based language learning app with 24 Swift files
- **Backend API** (`/backend/`): Express.js server with Supabase integration
- **Admin Dashboard** (`/backend/public/`): Web-based admin interface
- **Edge Functions** (`/backend/supabase/functions/`): Supabase functions for AI processing

## Development Commands

### iOS Development
The iOS project uses Xcode and has no package managers (no CocoaPods, SPM dependencies). Open the project in Xcode:
```bash
open LangTutor.xcodeproj
```

### Backend Development
Backend is Node.js/Express with the following commands:
```bash
cd backend
npm install                 # Install dependencies
npm run dev                 # Development with nodemon
npm start                   # Production mode
```

## High-Level Architecture

### iOS App Architecture (SwiftUI)
- **Entry Point**: `DuoVibesApp.swift` - Main app starting with HomeView (bypasses auth for development)
- **Core Views**: Modular SwiftUI components, each under 350 lines per design standard
- **Data Models**: Centralized in specific files (SocialModels.swift, SubscriptionModels.swift)
- **User Profile System**: `UserProfile` struct with language preferences for audio/text lessons
- **Realtime Speech**: `RealtimeSpeechManager` with Swift 6 concurrency for speech-to-speech AI conversations

### Backend Architecture (Node.js/Express)
- **Server**: `server.js` - Express server with security middleware, rate limiting, CORS
- **Route Structure**: Modular routes in `/routes/` folder
  - `auth.js` - User authentication with email validation
  - `learning.js` - AI chat endpoints that route to existing Supabase Edge Functions
  - `payments.js` - Stripe subscription management with Bitcoin integration
  - `social.js` - Social features (posts, follows, messaging)
  - `admin.js` - Admin dashboard API with authentication middleware
- **Database**: Supabase with RLS policies defined in `supabase-schema.sql`

### AI Integration Architecture
The app uses **existing Supabase Edge Functions** rather than creating new ones:
- **Routing Logic**: Backend routes to `openai`, `claude-ai`, or `deepseek` functions based on language
- **Language Mapping**: English → OpenAI, French → Claude, Others → DeepSeek
- **Edge Function**: `/backend/supabase/functions/ai-chat/index.ts` handles multi-AI routing
- **Speech Integration**: `RealtimeSpeechManager` calls Edge Functions for audio lessons

### Payment System Architecture
- **Pricing Tiers**: Weekly ($9.99), Monthly ($24.99), Yearly ($59.99/€60.00)
- **Bitcoin Integration**: 20% discount on all plans
- **Stripe Integration**: Full lifecycle management with webhooks in `payments.js`
- **Currency Detection**: Automatic USD/EUR selection based on user location

### Code Quality Standards
- **Component Size**: All Swift views must be under 350 lines (enforced pattern)
- **Module Size Enforcement**: Whenever a module is longer than 350 lines, ALWAYS use gemini CLI to identify large files:
  ```bash
  ./gemini-backup.sh "find LangTutor -name \"*.swift\" -exec wc -l {} + | sort -nr | head -10"
  ```
  **IMPORTANT**: Always use gemini CLI for this bash command execution and not manual process. Use `./gemini-backup.sh` to execute bash commands through Gemini API. Then use gemini CLI to analyze and refactor the module to 200 lines or less
- **Code Search and Analysis**: ALWAYS use gemini CLI for all code search operations instead of manual bash commands:
  ```bash
  ./gemini-backup.sh "rg --type swift \"struct Config\" LangTutor/"
  ```
  **IMPORTANT**: Always use gemini CLI for ripgrep searches and not manual process. Use `./gemini-backup.sh` to execute bash commands through Gemini API. Use gemini CLI for 100% of context processing analysis
- **Modular Design**: Features broken into reusable components
- **Error Handling**: Friendly, encouraging error messages throughout
- **iOS Compatibility**: iOS 17+ syntax with backwards compatibility
- **Swift 6 Compliance**: Proper concurrency handling with `@MainActor` and `nonisolated`

## Key Configuration Files

### Environment Variables (Backend)
Required in `/backend/.env`:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Database connection
- `STRIPE_SECRET_KEY` - Payment processing
- `JWT_SECRET` - Authentication tokens
- API keys for AI services (DEEPSEEK_API_KEY, etc.)
- `ASTRIA_API_KEY`: `sd_EC8jTkhdDJL3sn2HmSJB23qEfAXMRB` - Astria AI image generation service

### Database Schema
- Schema defined in `/backend/supabase-schema.sql`
- Tables: `profiles`, `subscriptions`, `api_logs`, `posts`, `follows`, `direct_messages`
- All tables have Row Level Security (RLS) enabled

## Development Workflow

### Component Development Pattern
1. Read existing components to understand patterns before creating new ones
2. Keep all SwiftUI views under 200 lines
3. Use modular subcomponents for complex views
4. Follow existing naming conventions and file organization
5. Look at `project-tasks.mdc` for similar error patterns when fixing issues

### Testing Approach
- iOS: Standard XCTest framework (`LangTutorTests/`, `LangTutorUITests/`)
- Backend: No test framework currently configured

### Admin Dashboard Access
- Web interface at `/backend/public/admin.html`
- Mock authentication: admin@duovibes.com / admin123
- Features: user management, analytics, content moderation, payment tracking

## Integration Points

### iOS ↔ Backend Communication
- iOS calls Express API which routes to appropriate Supabase Edge Functions
- Authentication via JWT tokens
- Subscription verification for AI access

### AI Service Integration
- Uses existing Edge Functions (`openai`, `claude-ai`, `deepseek`)
- Request format: `{message, context, language, userId, aiService}`
- Response format: `{response, tokensUsed, context, suggestions}`

### Social Features Integration
- Posts, follows, direct messaging with encouraging AI responses
- Real-time messaging capabilities
- Profile system with achievements and statistics

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Git Commit Guidelines
IMPORTANT: When creating git commits, NEVER include "Co-Authored-By: Claude" or any similar attribution to Claude/AI assistance in commit messages. Keep all commit messages focused on technical changes only.
IMPORTANT: This applies to ALL git operations including local commits and pushes to remote repositories. Never add AI attribution in any git commit messages.