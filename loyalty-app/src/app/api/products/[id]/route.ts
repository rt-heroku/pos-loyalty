import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { Product } from '@/types/product';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate that id is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Get product details
    const productQuery = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.category,
        p.brand,
        p.sku,
        p.stock,
        p.product_type,
        p.collection,
        p.material,
        p.color,
        p.dimensions,
        p.weight,
        p.warranty_info,
        p.care_instructions,
        p.main_image_url,
        p.is_active,
        p.featured,
        p.sort_order,
        p.sf_id,
        p.created_at,
        p.updated_at
      FROM products p
      WHERE p.id = $1
    `;

    const productResult = await query(productQuery, [id]);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const row = productResult.rows[0];

    // Get product images - prioritize main_image_url first
    let images: Array<{
      id: string;
      url: string;
      alt: string;
      isPrimary: boolean;
    }> = [];
    
    // First, check if main_image_url exists and use it as primary
    if (row.main_image_url && row.main_image_url.trim() !== '') {
      images.push({
        id: 'main',
        url: row.main_image_url,
        alt: row.name,
        isPrimary: true
      });
    }
    
    // Then get additional images from product_images table
    const imagesQuery = `
      SELECT 
        id,
        image_url as url,
        alt_text as alt,
        is_primary as "isPrimary"
      FROM product_images 
      WHERE product_id = $1 AND image_url IS NOT NULL AND image_url != ''
      ORDER BY is_primary DESC, id ASC
    `;
    const imagesResult = await query(imagesQuery, [id]);
    
    // Add additional images (excluding any that might be duplicates of main_image_url)
    const additionalImages = imagesResult.rows.filter((img: any) => 
      !images.some(existing => existing.url === img.url)
    );
    images = images.concat(additionalImages);

    // Product variants not available in current schema

    // Get related products
    const relatedQuery = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.stock,
        p.is_active
      FROM products p
      WHERE p.category = $1 
        AND p.id != $2 
        AND p.is_active = true
      ORDER BY p.featured DESC, p.created_at DESC
      LIMIT 4
    `;
    const relatedResult = await query(relatedQuery, [row.category, id]);

    // Transform to Product interface
    const product: Product = {
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      images: images.map((img: any) => ({
        id: img.id,
        url: img.url,
        alt: img.alt || row.name,
        isPrimary: img.isPrimary || false,
        thumbnailUrl: img.url, // Use the same URL as thumbnail since we don't have separate thumbnail_url
      })),
      category: row.category,
      brand: row.brand,
      sku: row.sku,
      stockQuantity: parseInt(row.stock || '0'),
      stockStatus: 'in_stock', // Default status
      productType: row.product_type || '',
      collection: row.collection || '',
      material: row.material || '',
      color: row.color || '',
      dimensions: row.dimensions || '',
      weight: parseFloat(row.weight || '0'),
      warrantyInfo: row.warranty_info || '',
      careInstructions: row.care_instructions || '',
      mainImageUrl: row.main_image_url || '',
      isActive: row.is_active || false,
      isFeatured: row.featured || false,
      sortOrder: parseInt(row.sort_order || '0'),
      sfId: row.sf_id || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Add related products
    const relatedProducts = relatedResult.rows.map((rel: any) => ({
      id: rel.id,
      name: rel.name,
      price: parseFloat(rel.price),
      stockQuantity: parseInt(rel.stock || '0'),
      isActive: rel.is_active || false,
    }));

    return NextResponse.json({
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
