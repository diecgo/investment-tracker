---
description: Sync local changes to GitHub
---

# Sync to GitHub

This workflow commits all local changes and prepares them for push to GitHub.

## Steps

// turbo
1. Stage all changes:
```bash
git add .
```

// turbo
2. Create a commit with a descriptive message:
```bash
git commit -m "Update: [describe your changes]"
```

3. Push to GitHub (requires user authentication):
```bash
git push
```

> **Note**: The push command must be run manually in the terminal because it requires GitHub authentication.
