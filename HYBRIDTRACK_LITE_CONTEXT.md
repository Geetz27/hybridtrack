# HybridTrack Lite Context

## Goal
HybridTrack Lite is a simple personal tracker for recording gym and running workouts.
The main purpose is to log training consistently and use the results for weekly review with a coach workflow outside the app.

## Core job
The app should help the user:
- record gym sessions,
- record running sessions,
- view simple weekly history,
- prepare data for weekly review.

## Current direction
The project became too broad after adding AI-related ideas, prompt systems, and larger product concepts.
That expansion created extra context, more files, and more token usage without improving the core tracking job enough to justify the complexity.

## Scope now
### Keep
- Gym workout logging.
- Running workout logging.
- Simple weekly summary or history view.
- Basic export or easy-to-read review data.

### Freeze
- Athlete profile.
- AI integration inside the app.
- Prompt library inside the project.
- Telegram reminder features.
- Deep analytics and nonessential dashboards.

### Out of scope
- Building an all-in-one coaching platform.
- Expanding the app into a complex athlete management system.
- Adding features just because they are possible.

## Working rules for AI tools
- One task per session.
- Do not suggest extra features unless explicitly asked.
- Do not refactor unrelated areas.
- Choose the simplest working solution first.
- Treat old markdown chat files as archive, not as the main source of truth.

## Source of truth
From now on, this file should be treated as the main project context.
Older markdown files generated from long AI chats should be considered reference material only, because long chat-derived docs often increase confusion and token waste in later sessions.[1][2]

## Project status
The project is already useful enough for its original purpose when it can track workouts and support weekly review.
The current priority is simplification, not expansion.

## Next action
1. Archive old planning markdown files.
2. Keep only essential project files visible.
3. Verify the current app still supports gym logging, running logging, and weekly review.
4. Fix only the minimum needed issues.
5. Avoid new feature work until the lightweight version feels stable.[3]

## Prompt guardrail
Use this project context as the primary instruction.
Work only on the requested task.
Do not add features, product ideas, or architecture changes outside the stated scope.