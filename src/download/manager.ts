import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import axios from 'axios';
import { GitHubAsset } from '../github/client.js';

export interface DownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percent: number;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

export class DownloadManager {
  private downloadDir: string;

  constructor(downloadDir?: string) {
    this.downloadDir = downloadDir || './downloads';
  }

  async ensureDownloadDir(): Promise<void> {
    try {
      await mkdir(this.downloadDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  async downloadFile(
    url: string,
    filename: string,
    onProgress?: ProgressCallback
  ): Promise<string> {
    await this.ensureDownloadDir();
    
    const filePath = `${this.downloadDir}/${filename}`;
    
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
      maxRedirects: 5
    });

    const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
    let downloadedBytes = 0;

    const writer = createWriteStream(filePath);
    
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        if (onProgress && totalBytes > 0) {
          onProgress({
            totalBytes,
            downloadedBytes,
            percent: Math.round((downloadedBytes / totalBytes) * 100)
          });
        }
      });

      response.data.pipe(writer);
      
      writer.on('finish', () => {
        writer.close();
        resolve(filePath);
      });

      writer.on('error', (err) => {
        writer.close();
        reject(err);
      });
    });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getDownloadPath(): string {
    return this.downloadDir;
  }

  setDownloadPath(path: string): void {
    this.downloadDir = path;
  }
}
