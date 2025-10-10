# Database Changes Required for MuleSoft Product Import

## Overview
This document outlines the database schema changes needed to accommodate the MuleSoft product import flow for the provided JSON product structure.

## Current Database Schema Analysis

### Existing Product Tables
1. **`products`** - Main products table
2. **`product_images`** - Multiple images per product
3. **`product_features`** - Multiple features per product
4. **`generated_products`** - AI-generated product data

## Required Database Changes

### 1. Products Table Enhancements

The current `products` table already has most required fields, but we need to ensure compatibility with the input JSON structure:

#### Current Fields (✅ Already Present):
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(255))
- `price` (DECIMAL(10,2))
- `category` (VARCHAR(100))
- `stock` (INTEGER)
- `sku` (VARCHAR(50) UNIQUE)
- `brand` (VARCHAR(100))
- `collection` (VARCHAR(100))
- `description` (TEXT)
- `dimensions` (VARCHAR(100))
- `weight` (DECIMAL(5,2))
- `main_image_url` (TEXT)
- `is_active` (BOOLEAN)
- `featured` (BOOLEAN)
- `sort_order` (INTEGER)

#### Fields That May Need Adjustment:

1. **`description` field length**: 
   - Current: `TEXT` (unlimited)
   - Input: Can be very long descriptions
   - **Status**: ✅ No change needed

2. **`dimensions` field**:
   - Current: `VARCHAR(100)`
   - Input: Complex dimension strings like "26.0 x 19.0 x 13.0\" (15.0\" Expanded Depth)"
   - **Recommendation**: Increase to `VARCHAR(255)` or keep as `TEXT`

### 2. Product Images Table

#### Current Schema (✅ Compatible):
```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Input JSON Structure:
```json
"images": {
    "main_image_url": "https://tumi.scene7.com/is/image/Tumi/1171652693_main?wid=1020&hei=1238",
    "alt_text": "Short Trip Expandable 4 Wheeled Packing Case product image two",
    "additional_images": [
        {
            "url": "https://tumi.scene7.com/is/image/Tumi/1171652693_alt7?wid=1020&hei=1238",
            "alt_text": "Short Trip Expandable 4 Wheeled Packing Case product image two"
        }
    ]
}
```

**Status**: ✅ No changes needed - current schema handles this perfectly.

### 3. Product Features Table

#### Current Schema (✅ Compatible):
```sql
CREATE TABLE product_features (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Input JSON Structure:
```json
"dimensions": {
    "features": [
        ["Expansion", "15.0\" Expanded Depth"]
    ],
    "materials": [
        ["Primary Material", "Ballistic Nylon"]
    ],
    "finish": [
        ["finish_color", "Black"]
    ],
    "special_features": []
}
```

**Status**: ✅ No changes needed - current schema handles this perfectly.

## Data Mapping Strategy

### 1. Main Product Data Mapping
```javascript
// Input JSON → Database
{
    "product_name": "Short Trip Expandable 4 Wheeled Packing Case" → products.name
    "sku": "01171652693" → products.sku
    "brand": "Tumi" → products.brand
    "collection": "TUMI ALPHA" → products.collection
    "description": "Experience the luxury..." → products.description
    "pricing.price": "$1,035" → products.price (parsed as 1035.00)
    "dimensions.dimensions": "26.0 x 19.0 x 13.0\"..." → products.dimensions
    "dimensions.images.main_image_url": "https://..." → products.main_image_url
}
```

### 2. Images Mapping
```javascript
// Main Image
{
    "product_id": [from products.id],
    "image_url": "https://tumi.scene7.com/is/image/Tumi/1171652693_main?wid=1020&hei=1238",
    "alt_text": "Short Trip Expandable 4 Wheeled Packing Case product image two",
    "is_primary": true,
    "sort_order": 0
}

// Additional Images
{
    "product_id": [from products.id],
    "image_url": "https://tumi.scene7.com/is/image/Tumi/1171652693_alt7?wid=1020&hei=1238",
    "alt_text": "Short Trip Expandable 4 Wheeled Packing Case product image two",
    "is_primary": false,
    "sort_order": 1
}
```

### 3. Features Mapping
```javascript
// Dimension Features
{
    "product_id": [from products.id],
    "feature_name": "Expansion",
    "feature_value": "15.0\" Expanded Depth"
}

// Material Features
{
    "product_id": [from products.id],
    "feature_name": "Material: Primary Material",
    "feature_value": "Ballistic Nylon"
}

// Finish Features
{
    "product_id": [from products.id],
    "feature_name": "Finish: finish_color",
    "feature_value": "Black"
}
```

## Optional Enhancements

### 1. Add Product Categories Table
Consider creating a separate categories table for better data normalization:

```sql
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Add Product Tags Table
For better searchability and filtering:

```sql
CREATE TABLE product_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_tag_assignments (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES product_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);
```

### 3. Add Product Variants Table
For products with multiple variants (size, color, etc.):

```sql
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Conclusion

**Good News**: The current database schema is already well-designed and can handle the MuleSoft product import without any structural changes!

### What Works Out of the Box:
- ✅ Main product data mapping
- ✅ Multiple images per product
- ✅ Multiple features per product
- ✅ Proper foreign key relationships
- ✅ Data types are appropriate

### Minor Considerations:
- Consider increasing `dimensions` field length if needed
- The current schema is flexible enough to handle the complex JSON structure
- All required fields are present and properly typed

### No Database Changes Required
The existing database schema is fully compatible with the MuleSoft product import flow. The MuleSoft flow can be implemented immediately using the current database structure.
