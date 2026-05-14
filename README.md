# front-mcp-server

A [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that gives AI assistants read-only access to your [Front](https://front.com/) workspace -- conversations, messages, contacts, and inboxes.

## Tools

| Tool | Description |
|------|-------------|
| `front_list_inboxes` | List all inboxes |
| `front_list_inbox_conversations` | List conversations from a specific inbox |
| `front_search_conversations` | Search conversations (supports Front query syntax) |
| `front_get_conversation` | Get conversation details, tags, assignee, status |
| `front_get_conversation_messages` | Get all messages in a thread |
| `front_get_contact` | Get contact by ID |
| `front_get_contact_by_email` | Find a contact by email address |
| `front_get_conversation_comments` | Get internal comments and drafts |

## Prerequisites

- Node.js 18 or later
- A Front API token

## Getting a Front API token

1. Open Front and go to **Settings > Tools & Integrations > API**
2. Click **New API Token**
3. Give it a name (e.g. "MCP Server")
4. Copy the token -- you'll need it for configuration below

## Installation

### npx (recommended)

No install needed. Just add the configuration below and your MCP client will download and run the server automatically.

### Global install

```bash
npm install -g front-mcp-server
```

## Configuration

### Claude Code

Add to your `~/.claude.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "front": {
      "command": "npx",
      "args": ["-y", "front-mcp-server"],
      "env": {
        "FRONT_API_TOKEN": "your-front-api-token"
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "front": {
      "command": "npx",
      "args": ["-y", "front-mcp-server"],
      "env": {
        "FRONT_API_TOKEN": "your-front-api-token"
      }
    }
  }
}
```

## Security

- **Read-only** -- no write operations are exposed. The server cannot send messages, modify conversations, or change any data in Front.
- The API token is passed via environment variable, never stored in code or config files that get committed.

## Development

```bash
git clone https://github.com/Precision-Fuel-Hydration/front-mcp-server.git
cd front-mcp-server
npm install
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

To test locally, point your MCP config at the built file:

```json
{
  "mcpServers": {
    "front": {
      "command": "node",
      "args": ["/path/to/front-mcp-server/build/index.js"],
      "env": {
        "FRONT_API_TOKEN": "your-front-api-token"
      }
    }
  }
}
```

## License

MIT
