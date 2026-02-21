/// <reference types="multer" />
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    // Base upload directory — resolves to <project-root>/uploads
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    this.ensureDirectory(this.uploadDir);
  }

  /**
   * Upload & compress a single image file.
   * Converts to WebP, limits dimensions to maxSize, targets <= 500 KB.
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
    maxWidth = 800,
    maxHeight = 800,
  ): Promise<string> {
    this.validateImageFile(file);

    const folderPath = path.join(this.uploadDir, folder);
    this.ensureDirectory(folderPath);

    const fileName = `${randomUUID()}.webp`;
    const filePath = path.join(folderPath, fileName);

    // Compress with sharp → WebP, resize if larger than max dimensions
    await sharp(file.buffer)
      .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filePath);

    // Return relative URL path (served via static files)
    return `/uploads/${folder}/${fileName}`;
  }

  /**
   * Upload a generic file (no compression).
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const folderPath = path.join(this.uploadDir, folder);
    this.ensureDirectory(folderPath);

    const ext = path.extname(file.originalname) || '.bin';
    const fileName = `${randomUUID()}${ext}`;
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/${folder}/${fileName}`;
  }

  /**
   * Delete a file by its URL path (e.g. /uploads/avatars/xxx.webp).
   */
  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    // Sanitize: only allow paths starting with /uploads/
    const relativePath = fileUrl.replace(/^\/uploads\//, '');
    if (relativePath.includes('..')) {
      throw new BadRequestException('Invalid file path');
    }

    const fullPath = path.join(this.uploadDir, relativePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  // --- Helpers ---

  private validateImageFile(file: Express.Multer.File): void {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Format file tidak didukung: ${file.mimetype}. Gunakan JPEG, PNG, WebP, atau GIF.`,
      );
    }
    // Max 5 MB raw input
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Ukuran file maksimal 5 MB.');
    }
  }

  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
