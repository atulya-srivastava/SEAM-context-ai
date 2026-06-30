# SEAM - AI Native Searchable Memory for Teams

## Overview

This project is an AI-native solution designed to unify and streamline knowledge retrieval across multiple team collaboration platforms, including GitHub, Slack, Notion, Google Drive, Gmail, and Microsoft Teams. By integrating these tools into a single platform, it eliminates the fragmentation of critical knowledge, enabling fast, natural language searches and boosting team productivity.

## Problem

Teams rely on multiple tools like Slack, Google Docs, Notion, GitHub, and Drive, but critical information is scattered across these platforms. Searching across them is slow, inconsistent, and leads to wasted time and reduced productivity.

## Solution

- **Unified AI Knowledge Layer**: Integrates with GitHub, Slack, Notion, Google Drive, Gmail, and Microsoft Teams.
- **Embeddings & Vector Database**: Uses embeddings (powered by Google Gemini) stored in a Postgres vector database (Supabase pgvector) with Row-Level Security (RLS) for multi-tenant data isolation.
- **Natural Language Queries**: Allows users to search with queries like, "Show me all Slack conversations about API keys from last week."
- **AI Intent Classification**: Employs a locally fine-tuned DistilBERT model to automatically route user queries to the correct integrations without relying on keyword heuristics.
- **Simplify Feature**: Provides concise, pinpointed responses when users need summarized results.

[![Screenshot-2025-09-07-101944.png](https://i.postimg.cc/FKP4j1zC/Screenshot-2025-09-07-101944.png)](https://postimg.cc/5HFTJ4w8)

## Hackathon MVP Features

- **Integration**: Connects with GitHub, Slack, Notion, Google Drive, Gmail, and Microsoft Teams.
- **Modern Chat UI**: A user-friendly interface for natural language queries with auto-detection (powered by DistilBERT) for specific platforms or combinations.
- **Search Flexibility**: Users can search within a single platform (e.g., Slack or Drive) or across multiple platforms, with results appended and contextualized.
- **Simplify Option**: Condenses results into concise, to-the-point responses.
- **Embedding Storage**: Stores embeddings securely in a hosted Supabase pgvector database, protected by Postgres Row-Level Security (RLS).

[![IMG-20250907-WA0007.jpg](https://i.postimg.cc/KvcQRJj1/IMG-20250907-WA0007.jpg)](https://postimg.cc/kDZWHNxC)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:

   ```bash
   cd <project-directory>
   ```
3. Install dependencies:

   ```bash
   npm install
   ```

   If you encounter dependency issues, try:

   ```bash
   npm install --legacy-peer-deps
   ```
4. Set up environment variables (see Environment Variables below).
5. Run the project:

   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the project root and configure the following variables:

### Frontend

```env
NEXT_PUBLIC_GEMINI_API_KEY=<your-gemini-api-key>
NEXT_PUBLIC_SLACK_WEBHOOK_URL=<your-slack-webhook-url>
NEXT_PUBLIC_NOTION_WEBHOOK_URL=<your-notion-webhook-url>
NEXT_PUBLIC_GMAIL_WEBHOOK_URL=<your-gmail-webhook-url>
NEXT_PUBLIC_TEAMS_WEBHOOK_URL=<your-teams-webhook-url>
NEXT_PUBLIC_DRIVE_WEBHOOK_URL=<your-drive-webhook-url>
```

### Backend

```env
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
GITHUB_CALLBACK_URL=<your-github-callback-url>
GITHUB_WEBHOOK_SECRET=<your-github-webhook-secret>
CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
SESSION_SECRET=<your-session-secret>
MONGO_DB_URI=<your-mongodb-uri>
GROQ_API_KEY=<your-groq-api-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

## Usage

1. **Access the Application**: Open the landing page in your browser after running `npm run dev`.
2. **Chat UI**: Use the modern chat interface to perform natural language searches.
3. **Search Options**:
   - Search within a specific platform (e.g., Slack, Drive, Gmail) or combine multiple platforms.
   - Use the **Simplify** feature to get concise, summarized responses.
4. **Example Queries**:
   - "Find all Slack messages about API keys from last week."
   - "Show me Notion documents related to project planning."
   - "Search GitHub issues and Drive files about bug fixes."

## Technologies Used

- **Frontend**: Next.js, Tailwind CSS.
- **Backend**: Node.js, Express, MongoDB, Clerk for authentication
- **AI & Embeddings**: Google Gemini for embeddings, Supabase pgvector for vector storage, DistilBERT (via @xenova/transformers) for intent classification.
- **Integrations**: GitHub, Slack, Notion, Google Drive, Gmail, Microsoft Teams, n8n
