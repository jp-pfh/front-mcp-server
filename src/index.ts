#!/usr/bin/env node

/**
 * Front MCP Server
 * Provides read-only access to Front conversations, messages, and contacts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { FrontClient } from './front-client.js';

// Get API token from environment
const API_TOKEN = process.env.FRONT_API_TOKEN;
if (!API_TOKEN) {
  console.error('Error: FRONT_API_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize Front client
const frontClient = new FrontClient({ apiToken: API_TOKEN });

// Create MCP server
const server = new Server(
  {
    name: 'front-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'front_list_inboxes',
        description: 'List all Front inboxes. Use this first to get inbox IDs for filtering conversations.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'front_list_inbox_conversations',
        description: 'List conversations from a specific inbox. Returns most recent conversations first. Supports pagination.',
        inputSchema: {
          type: 'object',
          properties: {
            inbox_id: {
              type: 'string',
              description: 'The inbox ID (e.g., "inb_123"). Use front_list_inboxes to get inbox IDs.',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of conversations to return (default: 50, max: 100)',
              default: 50,
            },
            page_token: {
              type: 'string',
              description: 'Pagination token from previous response (optional)',
            },
          },
          required: ['inbox_id'],
        },
      },
      {
        name: 'front_search_conversations',
        description: 'Search conversations by query string. Supports Front search syntax (e.g., "tag:urgent", "status:open", email addresses, keywords).',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query. Examples: "tag:urgent status:open", "customer@example.com", "order issue"',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 50, max: 100)',
              default: 50,
            },
            page_token: {
              type: 'string',
              description: 'Pagination token from previous response (optional)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'front_get_conversation',
        description: 'Get detailed information about a specific conversation, including metadata, tags, assignee, and status.',
        inputSchema: {
          type: 'object',
          properties: {
            conversation_id: {
              type: 'string',
              description: 'The conversation ID (e.g., "cnv_123")',
            },
          },
          required: ['conversation_id'],
        },
      },
      {
        name: 'front_get_conversation_messages',
        description: 'Get all messages in a conversation thread. Returns complete message history with body text, attachments, and metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            conversation_id: {
              type: 'string',
              description: 'The conversation ID (e.g., "cnv_123")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of messages to return (default: 100)',
              default: 100,
            },
            page_token: {
              type: 'string',
              description: 'Pagination token from previous response (optional)',
            },
          },
          required: ['conversation_id'],
        },
      },
      {
        name: 'front_get_contact',
        description: 'Get contact information by contact ID. Returns name, email handles, custom fields, and conversation history link.',
        inputSchema: {
          type: 'object',
          properties: {
            contact_id: {
              type: 'string',
              description: 'The contact ID (e.g., "crd_123")',
            },
          },
          required: ['contact_id'],
        },
      },
      {
        name: 'front_get_contact_by_email',
        description: 'Find a contact by email address. Useful when you have a customer email and need their contact details.',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Email address to search for',
            },
          },
          required: ['email'],
        },
      },
      {
        name: 'front_get_conversation_comments',
        description: 'Get comments and drafts for a conversation. Includes internal notes and draft replies.',
        inputSchema: {
          type: 'object',
          properties: {
            conversation_id: {
              type: 'string',
              description: 'The conversation ID (e.g., "cnv_123")',
            },
          },
          required: ['conversation_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'front_list_inboxes': {
        const result = await frontClient.listInboxes();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result._results, null, 2),
            },
          ],
        };
      }

      case 'front_list_inbox_conversations': {
        const { inbox_id, limit, page_token } = args as {
          inbox_id: string;
          limit?: number;
          page_token?: string;
        };
        const result = await frontClient.listInboxConversations(inbox_id, {
          limit: limit || 50,
          page_token,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  conversations: result._results,
                  pagination: result._pagination,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'front_search_conversations': {
        const { query, limit, page_token } = args as {
          query: string;
          limit?: number;
          page_token?: string;
        };
        const result = await frontClient.searchConversations(query, {
          limit: limit || 50,
          page_token,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  conversations: result._results,
                  pagination: result._pagination,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'front_get_conversation': {
        const { conversation_id } = args as { conversation_id: string };
        const result = await frontClient.getConversation(conversation_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'front_get_conversation_messages': {
        const { conversation_id, limit, page_token } = args as {
          conversation_id: string;
          limit?: number;
          page_token?: string;
        };
        const result = await frontClient.listConversationMessages(conversation_id, {
          limit: limit || 100,
          page_token,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  messages: result._results,
                  pagination: result._pagination,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'front_get_contact': {
        const { contact_id } = args as { contact_id: string };
        const result = await frontClient.getContact(contact_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'front_get_contact_by_email': {
        const { email } = args as { email: string };
        const result = await frontClient.getContactByHandle(email);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'front_get_conversation_comments': {
        const { conversation_id } = args as { conversation_id: string };
        const result = await frontClient.listConversationComments(conversation_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result._results, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Front MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
