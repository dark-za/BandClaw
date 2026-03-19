# BandClaw Layered Architecture

This document describes the architectural principles and folder structure of the BandClaw Agent, designed to be scalable, maintainable, and aligned with Clean Architecture principles.

## Core Design Philosophy

BandClaw follows a separation of concerns methodology, dividing code into logically isolated layers. This ensures that the core domain logic (the intelligent agent) remains decoupled from external factors like database engines, external APIs, and user interfaces (e.g., Telegram).

## Directory Structure

```text
src/
├── core/
│   ├── agent.ts         # Core agent loop and decision making
│   └── parsers/         # String manipulation, regex extractors, tool parsers
├── infrastructure/
│   ├── db.ts            # SQLite database access and query logic
│   ├── bot.ts           # Telegram Bot polling and middleware
│   ├── webhook.ts       # Telegram webhook server configuration
│   └── config.ts        # Environment variable validation and loading
├── services/
│   └── llm.ts           # Abstractions for interacting with OpenAI/LM Studio APIs
├── features/
│   └── skills/          # Dynamically loaded tools mapped to the SkillManager
├── interfaces/
│   └── types.ts         # Shared TypeScript interfaces for models, schemas, and skills
├── cli/
│   └── cli.ts           # Standalone terminal management tool (bandclaw command)
└── index.ts             # Composition Root: wires up infrastructure and starts the application
```

## Layer Descriptions

### 1. Core (`src/core/`)
Contains the pure domain logic. The `agent.ts` file acts as the brain, determining the sequence of execution. It relies *only* on abstractions (`services/`, `interfaces/`) and avoids direct dependency on the database or network clients.

### 2. Infrastructure (`src/infrastructure/`)
Handles everything "outside" the core domain. This layer touches the network, filesystem, and databases. Changes to Telegram's API or a swap from SQLite to PostgreSQL should solely occur in this directory.

### 3. Services (`src/services/`)
Wraps external dependencies via interfaces. Specifically, the `llm.ts` acts as the API client for local or remote Large Language Models.

### 4. Features (`src/features/`)
Vertical slices of functionality. The `skills/` directory holds the `SkillManager` and modular tools (e.g., filesystem, server context) that the agent can invoke. They are isolated from the main bot handler.

### 5. Configs & Interfaces
`interfaces/` acts as the universal language across layers. `config.ts` acts as the centralized source of truth for all runtime variables.

### 6. CLI
A secondary entrypoint located in `cli/`. It bypasses the core agent and network logic entirely to strictly provide operational and process management functionality.
