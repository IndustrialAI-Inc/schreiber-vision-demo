import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

export interface LocalUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
  downloadUrl: string;
}

export class LocalStorage {
  private uploadDir: string;

  constructor() {
    // Store uploads in public directory for development
    this.uploadDir = join(process.cwd(), 'public', 'uploads');
  }

  async put(
    filename: string,
    fileBuffer: ArrayBuffer,
    options: { access: 'public'; addRandomSuffix?: boolean } = {
      access: 'public',
    },
  ): Promise<LocalUploadResult> {
    try {
      // Ensure upload directory exists
      await mkdir(this.uploadDir, { recursive: true });

      // Generate filename with optional random suffix
      const finalFilename = options.addRandomSuffix
        ? this.addRandomSuffix(filename)
        : filename;

      // Write file to local directory
      const filePath = join(this.uploadDir, finalFilename);
      await writeFile(filePath, Buffer.from(fileBuffer));

      // Generate URLs (relative to public directory)
      const pathname = `uploads/${finalFilename}`;
      const url = `http://localhost:3000/${pathname}`;
      const downloadUrl = `${url}?download=1`;

      return {
        url,
        pathname,
        contentType: this.getContentType(filename),
        contentDisposition: `attachment; filename="${finalFilename}"`,
        downloadUrl,
      };
    } catch (error) {
      console.error('[LOCAL_STORAGE] Upload failed:', error);
      throw new Error('Local storage upload failed');
    }
  }

  private addRandomSuffix(filename: string): string {
    const ext = filename.split('.').pop();
    const name = filename.slice(0, -(ext?.length || 0) - 1);
    const suffix = randomBytes(16).toString('hex');
    return `${name}-${suffix}.${ext}`;
  }

  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      mp4: 'video/mp4',
      txt: 'text/plain',
      json: 'application/json',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
