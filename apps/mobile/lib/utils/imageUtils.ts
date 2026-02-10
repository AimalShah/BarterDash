/**
 * Image Utilities
 * Handles image URL resolution and validation for Supabase and external sources
 */

import { supabase } from "../supabase";

/**
 * Get public URL for Supabase storage path
 */
export const getSupabaseImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's a Supabase storage path, get public URL
  if (path.startsWith('product-images/') || path.startsWith('profile-images/') || path.startsWith('stream-thumbnails/')) {
    const { data: { publicUrl } } = supabase.storage
      .from('barterdash')
      .getPublicUrl(path);
    return publicUrl;
  }

  // Try to construct from common patterns
  if (!path.includes('/')) {
    // Assume it's a product image
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(path);
    return publicUrl;
  }

  return path;
};

/**
 * Get the first valid image from an array
 */
export const getFirstImage = (images: string[] | null | undefined): string | null => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }

  const firstImage = images[0];
  return getSupabaseImageUrl(firstImage);
};

/**
 * Get product image with fallbacks
 */
export const getProductImage = (product: any): string | null => {
  if (!product) return null;

  // Try images array first
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return getFirstImage(product.images);
  }

  // Try thumbnail
  if (product.thumbnail_url || product.thumbnailUrl) {
    return getSupabaseImageUrl(product.thumbnail_url || product.thumbnailUrl);
  }

  // Try image field
  if (product.image) {
    return getSupabaseImageUrl(product.image);
  }

  return null;
};

/**
 * Get stream thumbnail with fallbacks
 */
export const getStreamThumbnail = (stream: any): string | null => {
  if (!stream) return null;

  // Try thumbnail_url first
  if (stream.thumbnail_url) {
    return getSupabaseImageUrl(stream.thumbnail_url);
  }

  // Try thumbnailUrl (camelCase)
  if (stream.thumbnailUrl) {
    return getSupabaseImageUrl(stream.thumbnailUrl);
  }

  // Try images array
  if (stream.images && Array.isArray(stream.images) && stream.images.length > 0) {
    return getFirstImage(stream.images);
  }

  return null;
};

/**
 * Validate if an image URL is valid
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:');
};
