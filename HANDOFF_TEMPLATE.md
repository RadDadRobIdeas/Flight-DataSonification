# Project Handoff Template — Claude Code

> **How to use:** Copy this template into a file called `HANDOFF.md` at the root of your project. Fill in each section. When starting a new Claude Code session, point it to this file: *"Read HANDOFF.md and continue development."*
>
> Sections marked **(if applicable)** can be removed if they don't apply.

---

## Project Overview

<!-- One paragraph: what is this project, what does it do, who is it for? -->

**[Project Name]** is...

**Key design principles:**
-
-
-

---

## Tech Stack

<!-- List every major technology, framework, and tool. Be specific about versions where it matters (e.g., Svelte 5 runes vs legacy syntax, React class vs functional components). -->

- **Language:**
- **Framework:**
- **Build tool:**
- **Key libraries:**
- **Database:** <!-- if applicable -->
- **Deployment:** <!-- if applicable -->

---

## Repository Structure

<!-- Annotated file tree. Include every directory and key file with a short comment explaining its purpose. Don't list every file — focus on the ones a developer needs to understand the codebase. -->

```
project-root/
├── README.md                  #
├── package.json               #
└── src/
    ├── ...
```

---

## Architecture

<!-- How does data/control flow through the system? Use a text diagram if possible. Describe the major components and how they connect. -->

```
[Input] → [Processing] → [Output]
```

### Key Interfaces / Data Models

<!-- The core types, schemas, or data structures that everything else depends on. Include actual code if the types are concise enough. -->

```
// Example:
interface MyCoreThing {
  ...
}
```

---

## Current State

**Version:** <!-- e.g., v0.1.1 -->
**Branch:** <!-- e.g., main, feature/xyz -->

### What's Implemented
<!-- Bullet list of completed features -->
-
-

### What Works
<!-- What has been tested and confirmed functional -->
-
-

### Known Issues
<!-- Bugs, limitations, things that are implemented but broken or untested -->
-
-

### Recent Changes
<!-- What was the last batch of work? Summarize the most recent commits/changes so the new session knows what just happened. -->
-
-

---

## Bug / Issue History (if applicable)

<!-- If there have been user-reported bugs or testing rounds, summarize what was found, what was fixed, and what's still open. This prevents a new session from reintroducing old bugs. -->

| Issue | Status | Notes |
|-------|--------|-------|
| Example: empty downloads | Fixed in v0.1.1 | Auto-start recording |
| | | |

---

## Roadmap (if applicable)

<!-- Milestones, phases, or a prioritized backlog. What comes next, and what's the long-term vision? -->

### Next Milestone
-
-

### Future Plans
-
-

---

## Development Setup

<!-- Exact commands to go from a fresh clone to a running dev environment. Include any workarounds or gotchas. -->

```bash
# Clone and install
git clone <repo-url>
cd <project>
# ...

# Run development server
# ...

# Build for production
# ...

# Run tests
# ...
```

**Environment notes:**
- Node version:
- OS tested on:
- Known setup gotchas: <!-- e.g., SSL cert issues, specific env vars needed -->

---

## Configuration & Environment Variables (if applicable)

<!-- List every env var, config file, or secret the project needs. Mark which are required vs optional. Don't include actual secret values. -->

| Variable | Required | Description |
|----------|----------|-------------|
| `EXAMPLE_API_KEY` | Yes | API key for ... |
| | | |

---

## Testing (if applicable)

<!-- How to run tests, what's covered, what isn't. -->

- **Test framework:**
- **Run tests:** `npm test` / `pytest` / etc.
- **Coverage:** <!-- rough percentage or description of what's tested -->
- **Not yet tested:**

---

## Deployment (if applicable)

<!-- How does this get deployed? CI/CD pipeline, manual steps, hosting platform. -->

- **Platform:**
- **Deploy command:**
- **CI/CD:**

---

## External Services & APIs (if applicable)

<!-- Every external service the project talks to. Include base URLs, auth requirements, rate limits, and any quirks. -->

| Service | URL | Auth | Rate Limit | Notes |
|---------|-----|------|------------|-------|
| | | | | |

---

## User Preferences & Context

<!-- Who is the user/owner? What do they care about? What's their technical level? Any stylistic preferences for code, docs, or communication? This helps the AI assistant calibrate. -->

- **User:**
- **Experience level:** <!-- e.g., professional dev, hobbyist, non-technical -->
- **Preferences:**
  -
  -
- **Communication style:** <!-- e.g., concise answers, detailed explanations, needs terminal guidance -->

---

## Key Files to Read First

<!-- Ordered list: if a new developer (or AI) could only read 5-6 files to understand the project, which would they be? -->

1.
2.
3.
4.
5.

---

## Immediate Next Steps

<!-- The specific tasks to pick up right now. Be concrete — file names, line numbers, function names. -->

1.
2.
3.

---

## Conventions & Patterns (if applicable)

<!-- Any project-specific patterns, naming conventions, or architectural rules to follow. -->

- **Naming:** <!-- e.g., camelCase for variables, PascalCase for components -->
- **File organization:** <!-- e.g., one component per file, co-located tests -->
- **State management:** <!-- e.g., Svelte stores, Redux, Zustand -->
- **Error handling:** <!-- e.g., throw exceptions, return Result types -->
- **Commit style:** <!-- e.g., conventional commits, version prefixes -->
