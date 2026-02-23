# Forge&Chip.Connect

A CLI tool to download drivers and programs from GitHub Releases with a beautiful terminal interface.

## Features

- **Browse by Category**: Drivers, Programs, Utilities
- **Search**: Find software quickly
- **GitHub Integration**: Downloads directly from GitHub Releases
- **Progress Tracking**: Visual download progress
- **Cross-platform**: Works on Windows, macOS, and Linux

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd forge-and-chip-connect

# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

## Usage

```bash
# Run the application
npm start

# Or use the built binary
node dist/index.js
```

### Controls

- `↑↓` - Navigate
- `Enter` - Select
- `Esc` - Go back
- `s` - Search
- `r` - Refresh
- `d` - Show downloads
- `q` - Quit

## Configuration

Edit `src/config/repositories.ts` to add more programs/drivers:

```typescript
{
  name: 'Program Name',
  owner: 'github-owner',
  repo: 'github-repo',
  category: 'driver' | 'program' | 'utility',
  description: 'Description',
  tags: ['tag1', 'tag2'],
  filePatterns: ['*.exe', '*Setup*.exe']
}
```

## Requirements

- Node.js 18+
- npm or bun

## License

MIT
