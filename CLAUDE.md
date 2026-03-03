# TriviaGame — Claude Instructions

## Git & GitHub Workflow

**Always commit and push after completing any meaningful unit of work.**

- This project uses Git with a remote on GitHub (`jerrysam13/TriviaGame` on `main`).
- After finishing a feature, fix, or any notable change, stage the relevant files, write a clean commit message, and push to `origin main`.
- Never leave work uncommitted at the end of a session.
- Commit messages must be concise, imperative, and descriptive (e.g. `Add answer flash animation`, `Fix leaderboard sort order`, not `update stuff` or `fix bug`).
- Push after every commit so the remote always reflects the current state of the project.

### Commit workflow
```
git add <specific files>
git commit -m "Short imperative description"
git push origin main
```

### When to commit
- After creating or significantly modifying a file
- After fixing a bug
- After completing a feature or screen
- After any change the user approves or requests

## Project Overview

A browser-based trivia quiz game — three static files, no build step.

| File | Purpose |
|------|---------|
| `index.html` | DOM structure only — defines all IDs and class names |
| `style.css` | All styling, CSS custom properties, animations |
| `script.js` | All game logic, API calls, localStorage |

## Architecture Notes

- Uses Open Trivia Database API: `https://opentdb.com/api.php?amount=10&type=multiple&difficulty={difficulty}`
- `localStorage` key for leaderboard: `triviaLeaderboard`
- Screen transitions: CSS class `active` toggled on `<section class="screen">` elements
- HTML entity decoding: textarea trick (`t.innerHTML = html; return t.value`)
- Answer flash duration: `FLASH_DURATION = 1000ms` constant in `script.js`
- No `console.log` statements — ever
