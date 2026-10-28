import csv
import re

dataset_path = "dataset.csv"
refined_path = "dataset_refined.csv"

# Load existing dataset
rows = []
with open(dataset_path, "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) >= 2:
            text = row[0].strip().strip('"')
            label = row[1].strip().strip('"').lower()
            rows.append((text, label))

# Additional realistic dataset entries for robust training
extra_entries = [
    # General (Greetings, Chit-chat, General AI knowledge, Non-repo)
    ("hello", "general"),
    ("hi there", "general"),
    ("hey assistant", "general"),
    ("good morning", "general"),
    ("who are you", "general"),
    ("what can you do", "general"),
    ("tell me a joke", "general"),
    ("write a poem about space", "general"),
    ("what is 2 + 2", "general"),
    ("what is the capital of France", "general"),
    ("explain quantum mechanics simply", "general"),
    ("how does photosynthesis work", "general"),
    ("give me tips to sleep better", "general"),
    ("what is the difference between a fruit and a vegetable", "general"),
    ("current weather", "general"),
    ("weather today", "general"),
    ("weather in varanasi", "general"),
    ("what is the weather forecast", "general"),
    ("how is the weather today", "general"),
    
    # GitHub (Codebase, repos, files, functions, routing, commits, branches)
    ("how is routing done in this project", "github"),
    ("how does routing work in the api gateway", "github"),
    ("where is the API gateway routing handled", "github"),
    ("what is the name of the variable used for routing", "github"),
    ("show me the commit history for main branch", "github"),
    ("who committed the database connection code", "github"),
    ("where is authentication implemented in backend", "github"),
    ("explain the structure of index.js", "github"),
    ("find functions related to user login", "github"),
    ("what dependencies are used in package.json", "github"),
    ("check if there are any hardcoded API keys in the repo", "github"),
    ("show me recent pull requests", "github"),
    ("which branch has the latest feature code", "github"),
    ("explain how vector embeddings are saved in supabase", "github"),

    # Integration (Slack, Notion, Gmail, Teams, Drive)
    ("send a summary of this commit to Slack", "integration"),
    ("create a new document in Notion", "integration"),
    ("check my recent emails in Gmail", "integration"),
    ("send a message in MS Teams general channel", "integration"),
    ("upload this file to Google Drive", "integration"),
    ("notify the team on Slack about the build error", "integration"),
    ("add a task to Notion workspace", "integration"),
    ("get updates from MS Teams channel", "integration"),
]

github_keywords = [
    "repo", "repository", "codebase", "commit", "branch", "pull request", "pr",
    "routing", "route", "routes", "function", "file", "variable", "class",
    "index.js", "package.json", "dockerfile", "diff", "author", "contributor",
    "this project", "api gateway project", "in this project"
]

integration_keywords = [
    "slack", "notion", "gmail", "email", "ms teams", "teams", "google drive", "drive", "webhook"
]

refined_rows = []
for text, orig_label in rows + extra_entries:
    lower_text = text.lower()
    label = orig_label

    # Correct misclassifications based on domain semantics
    if any(kw in lower_text for kw in integration_keywords):
        label = "integration"
    elif any(kw in lower_text for kw in github_keywords):
        label = "github"
    elif "api gateway" in lower_text and ("how" in lower_text or "where" in lower_text or "routing" in lower_text or "work" in lower_text):
        label = "github"

    refined_rows.append((text, label))

# Remove duplicates while preserving order
seen = set()
unique_rows = []
for text, label in refined_rows:
    pair = (text.strip().lower(), label)
    if pair not in seen:
        seen.add(pair)
        unique_rows.append((text, label))

with open(dataset_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    for text, label in unique_rows:
        writer.writerow([text, label])

print(f"Dataset successfully refined and saved! Total clean entries: {len(unique_rows)}")
