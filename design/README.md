# Design Handoff — DocQuery AI

The design for this project lives in Claude Design. Use the `claude_design` MCP to access it directly in Claude Code — no zip file needed.

## How to Access the Design

1. In Claude Code, run `/design-login` to authenticate with Claude Design
2. Then paste this prompt to import the project:

```
Use the claude_design MCP (https://api.anthropic.com/v1/design/mcp, auth via /design-login) to import this project: https://claude.ai/design/p/a2b4a64b-94c3-4c81-904d-3f59797c58b1?file=DocQuery+AI.dc.html

Implement: DocQuery AI.dc.html
```

## What's in the Design

Three frames:
- **Desktop** — document loaded + active conversation (2–3 message pairs with quote blocks)
- **Desktop** — upload tab empty state (drop zone + paste text tab)
- **Mobile (375px)** — document loaded + conversation active

Visual system: white bg, blue primary (#2563EB), Inter font, two-panel layout (38% doc / 62% chat), rounded-xl, shadow-sm.
