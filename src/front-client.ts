/**
 * Front API Client
 * Read-only wrapper for Front API v1
 * API Docs: https://dev.frontapp.com/reference/introduction
 */

import fetch from 'node-fetch';

export interface FrontClientConfig {
  apiToken: string;
  baseUrl?: string;
}

export interface FrontConversation {
  id: string;
  subject: string;
  status: 'archived' | 'deleted' | 'spam' | 'open' | 'assigned';
  assignee?: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  recipient: {
    handle: string;
    name?: string;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
  links: {
    related: {
      events: string;
      followers: string;
      messages: string;
      comments: string;
      inboxes: string;
    };
  };
  created_at: number;
  is_private: boolean;
}

export interface FrontMessage {
  id: string;
  type: 'email' | 'custom' | 'sms' | 'call' | 'tweet' | 'facebook' | 'intercom' | 'yalo' | 'front_chat';
  is_inbound: boolean;
  created_at: number;
  blurb: string;
  author?: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
  };
  recipients: Array<{
    handle: string;
    name?: string;
    role: 'from' | 'to' | 'cc' | 'bcc';
  }>;
  body: string;
  text: string;
  subject?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    content_type: string;
    size: number;
  }>;
  metadata?: {
    thread_ref?: string;
    headers?: Record<string, string>;
  };
}

export interface FrontContact {
  id: string;
  name?: string;
  description?: string;
  handles: Array<{
    handle: string;
    source: string;
  }>;
  links: {
    related: {
      conversations: string;
      owner?: string;
    };
  };
  custom_fields?: Record<string, any>;
  is_spammer: boolean;
  created_at: number;
  updated_at: number;
}

export interface FrontInbox {
  id: string;
  name: string;
  is_private: boolean;
  type: string;
}

export class FrontClient {
  private apiToken: string;
  private baseUrl: string;

  constructor(config: FrontClientConfig) {
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || 'https://api2.frontapp.com';
  }

  private async request<T>(endpoint: string, options: Record<string, any> = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Front API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  // List conversations with pagination
  async listConversations(params?: {
    q?: string;
    page_token?: string;
    limit?: number;
  }): Promise<{ _results: FrontConversation[]; _pagination?: { next?: string } }> {
    const queryParams = new URLSearchParams();
    if (params?.q) queryParams.set('q', params.q);
    if (params?.page_token) queryParams.set('page_token', params.page_token);
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/conversations${query ? `?${query}` : ''}`);
  }

  // Get a specific conversation
  async getConversation(conversationId: string): Promise<FrontConversation> {
    return this.request(`/conversations/${conversationId}`);
  }

  // List messages in a conversation
  async listConversationMessages(conversationId: string, params?: {
    page_token?: string;
    limit?: number;
  }): Promise<{ _results: FrontMessage[]; _pagination?: { next?: string } }> {
    const queryParams = new URLSearchParams();
    if (params?.page_token) queryParams.set('page_token', params.page_token);
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/conversations/${conversationId}/messages${query ? `?${query}` : ''}`);
  }

  // Search conversations
  async searchConversations(query: string, params?: {
    page_token?: string;
    limit?: number;
  }): Promise<{ _results: FrontConversation[]; _pagination?: { next?: string } }> {
    const queryParams = new URLSearchParams({ q: query });
    if (params?.page_token) queryParams.set('page_token', params.page_token);
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    return this.request(`/conversations?${queryParams.toString()}`);
  }

  // Get a contact
  async getContact(contactId: string): Promise<FrontContact> {
    return this.request(`/contacts/${contactId}`);
  }

  // Get contact by handle (email)
  async getContactByHandle(handle: string): Promise<FrontContact> {
    const result = await this.request<{ _results: FrontContact[] }>(
      `/contacts?q[handles]=${encodeURIComponent(handle)}`
    );
    if (result._results.length === 0) {
      throw new Error(`No contact found with handle: ${handle}`);
    }
    return result._results[0];
  }

  // List inboxes
  async listInboxes(): Promise<{ _results: FrontInbox[] }> {
    return this.request('/inboxes');
  }

  // List conversations in an inbox
  async listInboxConversations(inboxId: string, params?: {
    page_token?: string;
    limit?: number;
  }): Promise<{ _results: FrontConversation[]; _pagination?: { next?: string } }> {
    const queryParams = new URLSearchParams();
    if (params?.page_token) queryParams.set('page_token', params.page_token);
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/inboxes/${inboxId}/conversations${query ? `?${query}` : ''}`);
  }

  // Get conversation comments (includes drafts)
  async listConversationComments(conversationId: string): Promise<{ _results: any[] }> {
    return this.request(`/conversations/${conversationId}/comments`);
  }
}
