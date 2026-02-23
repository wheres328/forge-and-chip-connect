import axios from 'axios';

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: GitHubAsset[];
}

export interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  content_type: string;
}

const GITHUB_API = 'https://api.github.com';

export class GitHubClient {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async getReleases(owner: string, repo: string): Promise<GitHubRelease[]> {
    try {
      const response = await axios.get(
        `${GITHUB_API}/repos/${owner}/${repo}/releases`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching releases: ${(error as Error).message}`);
    }
  }

  async getLatestRelease(owner: string, repo: string): Promise<GitHubRelease | null> {
    try {
      const response = await axios.get(
        `${GITHUB_API}/repos/${owner}/${repo}/releases/latest`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new Error(`Error fetching latest release: ${(error as Error).message}`);
    }
  }

  async getReleaseByTag(owner: string, repo: string, tag: string): Promise<GitHubRelease | null> {
    try {
      const response = await axios.get(
        `${GITHUB_API}/repos/${owner}/${repo}/releases/tags/${tag}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw new Error(`Error fetching release: ${(error as Error).message}`);
    }
  }

  filterAssetsByPattern(assets: GitHubAsset[], patterns: string[]): GitHubAsset[] {
    return assets.filter(asset => 
      patterns.some(pattern => {
        if (pattern.startsWith('*.')) {
          const ext = pattern.slice(1);
          return asset.name.toLowerCase().endsWith(ext.toLowerCase());
        }
        return asset.name.toLowerCase().includes(pattern.toLowerCase());
      })
    );
  }
}
