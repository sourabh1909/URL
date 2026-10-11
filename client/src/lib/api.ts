export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  avatarUrl: string | null;
  providers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShortLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shortUrl: string;
  clicksCount: number;
  qrCode?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OverviewMetrics {
  totalLinks: number;
  activeLinks: number;
  totalClicks: number;
  clicksTrend: Array<{ date: string; clicks: number }>;
  deviceBreakdown: Array<{ name: string; count: number }>;
  referrerBreakdown: Array<{ name: string; count: number }>;
  countryBreakdown: Array<{ name: string; count: number }>;
}

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    };

    const targetUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const res = await fetch(targetUrl, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = data?.error?.message || `Request failed with status ${res.status}`;
      const error: any = new Error(errorMessage);
      error.status = res.status;
      error.code = data?.error?.code;
      throw error;
    }

    return data as T;
  }

  // Auth
  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/logout', { method: 'POST' });
  }

  async deleteAccount(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/account', { method: 'DELETE' });
  }

  // Links
  async createLink(originalUrl: string, customAlias?: string): Promise<{ link: ShortLink }> {
    return this.request<{ link: ShortLink }>('/api/links', {
      method: 'POST',
      body: JSON.stringify({ originalUrl, customAlias: customAlias || undefined }),
    });
  }

  async listLinks(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'createdAt' | 'clicks' | 'shortCode';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ items: ShortLink[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    return this.request<{ items: ShortLink[]; pagination: Pagination }>(`/api/links?${query.toString()}`);
  }

  async getLink(id: string): Promise<{ link: ShortLink }> {
    return this.request<{ link: ShortLink }>(`/api/links/${id}`);
  }

  async updateLink(id: string, updates: { originalUrl?: string; isActive?: boolean }): Promise<{ link: ShortLink }> {
    return this.request<{ link: ShortLink }>(`/api/links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteLink(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/links/${id}`, {
      method: 'DELETE',
    });
  }

  async checkAlias(alias: string): Promise<{ alias: string; isAvailable: boolean }> {
    return this.request<{ alias: string; isAvailable: boolean }>(`/api/links/check-alias/${encodeURIComponent(alias)}`);
  }

  // Analytics
  async getOverview(range: '7d' | '30d' | '90d' | 'all' = '30d'): Promise<{ overview: OverviewMetrics; range: string }> {
    return this.request<{ overview: OverviewMetrics; range: string }>(`/api/analytics/overview?range=${range}`);
  }

  async getLinkAnalytics(linkId: string, range: '7d' | '30d' | '90d' | 'all' = '30d'): Promise<{
    link: ShortLink;
    totalClicks: number;
    clicksTrend: Array<{ date: string; clicks: number }>;
    deviceBreakdown: Array<{ name: string; count: number }>;
    referrerBreakdown: Array<{ name: string; count: number }>;
    countryBreakdown: Array<{ name: string; count: number }>;
    range: string;
  }> {
    return this.request(`/api/analytics/${linkId}?range=${range}`);
  }
}

export const api = new ApiClient();
