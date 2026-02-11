import { SetMetadata } from '@nestjs/common';

// Ini adalah "Key" rahasia untuk menandai route public
export const IS_PUBLIC_KEY = 'isPublic';

// Ini decoratornya
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);