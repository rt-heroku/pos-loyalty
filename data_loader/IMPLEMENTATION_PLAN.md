# Data Loader Implementation Plan

## Project Overview
Implement a CSV data loader wizard in the Product Management section that allows users to upload CSV files and map them to database fields for bulk data import.

## Requirements Summary
- **File Size Limit**: 25MB maximum
- **Error Handling**: Store errors in database table for logging/display
- **Progress Tracking**: No real-time progress (simple status updates)
- **Auto-Mapping**: Yes, auto-suggest field mappings based on name similarity
- **Data Transformations**: Basic (date formats, numbers) - nothing complex

## Storage Strategy: Option 2 - Temp Table Approach
**Rationale**: Best for queryability, validation, and Heroku compatibility

## Database Schema

### 1. Data Loader Jobs Table
```sql
CREATE TABLE data_loader_jobs (
    id SERIAL PRIMARY KEY,
    job_id UUID DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('products', 'customers')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'processing', 'completed', 'failed')),
    file_name VARCHAR(255),
    total_rows INTEGER,
    processed_rows INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    field_mapping JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

### 2. Data Loader Rows Table
```sql
CREATE TABLE data_loader_rows (
    id SERIAL PRIMARY KEY,
    job_id UUID REFERENCES data_loader_jobs(job_id),
    row_number INTEGER,
    raw_data JSONB, -- Store original CSV row data
    mapped_data JSONB, -- Store mapped data after field mapping
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Data Loader Errors Table
```sql
CREATE TABLE data_loader_errors (
    id SERIAL PRIMARY KEY,
    job_id UUID REFERENCES data_loader_jobs(job_id),
    row_id INTEGER REFERENCES data_loader_rows(id),
    error_type VARCHAR(50), -- 'validation', 'import', 'mapping'
    error_message TEXT,
    field_name VARCHAR(100),
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Timeline: 4-5 Weeks

### Phase 1: Database Setup (Week 1)
**Files to create:**
- `sql/01_create_tables.sql` - Database schema
- `sql/02_sample_data.sql` - Test data
- `utils/csvParser.js` - CSV parsing utilities
- `utils/fieldMapper.js` - Auto-mapping logic
- `utils/dataValidator.js` - Data validation

**Tasks:**
1. Create database tables with proper indexes
2. Implement CSV parsing with 25MB limit
3. Create basic file upload endpoint
4. Implement auto-mapping algorithm

### Phase 2: Backend API Development (Week 2)
**Files to create:**
- `server.js` updates for new endpoints

**Endpoints to implement:**
1. `POST /api/data-loader/upload` - File upload and CSV parsing
2. `GET /api/data-loader/fields/:jobId` - Get CSV and DB fields
3. `POST /api/data-loader/mapping/:jobId` - Save field mapping
4. `GET /api/data-loader/preview/:jobId` - Preview mapped data
5. `POST /api/data-loader/process/:jobId` - Execute data import
6. `GET /api/data-loader/status/:jobId` - Get job status
7. `GET /api/data-loader/errors/:jobId` - Get import errors

### Phase 3: Frontend Components (Week 3-4)
**Files to create:**
- `components/DataLoaderModal.js` - Main wizard container
- `components/FileUploadStep.js` - File upload with drag-and-drop
- `components/FieldMappingStep.js` - Drag-and-drop field mapping
- `components/DataPreviewStep.js` - Preview mapped data
- `components/ProcessDataStep.js` - Execute import

**Features:**
1. File upload with drag-and-drop (25MB limit)
2. Type selection (products/customers)
3. Auto-suggested field mappings
4. Manual drag-and-drop mapping override
5. Data preview table
6. Import execution with status updates

### Phase 4: Integration (Week 4-5)
**Files to modify:**
- `public/components/views/SettingsView.js` - Add Data Loader button
- `public/index.html` - Include new components

**Tasks:**
1. Add "Data Loader" button to Product Management
2. Integrate with existing product/customer management
3. Add error logging and display
4. Testing and refinement

## Auto-Mapping Algorithm

```javascript
const autoMapFields = (csvFields, dbFields) => {
    const mapping = {};
    
    csvFields.forEach(csvField => {
        const normalizedCsv = csvField.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Find best match using similarity
        const bestMatch = dbFields.find(dbField => {
            const normalizedDb = dbField.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normalizedCsv === normalizedDb || 
                   normalizedCsv.includes(normalizedDb) || 
                   normalizedDb.includes(normalizedCsv);
        });
        
        if (bestMatch) {
            mapping[csvField] = bestMatch;
        }
    });
    
    return mapping;
};
```

## Data Transformation Examples

### Date Formats
- Input: "1972-10-19" → Output: "1972-10-19"
- Input: "10/19/1972" → Output: "1972-10-19"
- Input: "Oct 19, 1972" → Output: "1972-10-19"

### Numbers
- Input: "234.37" → Output: 234.37
- Input: "$234.37" → Output: 234.37
- Input: "234,37" → Output: 234.37

## Error Handling Strategy

### Validation Errors
- Store in `data_loader_errors` table
- Include field name, value, and error message
- Allow user to review and fix errors

### Import Errors
- Track failed rows in `data_loader_rows` table
- Log detailed error messages
- Provide error summary to user

## File Structure
```
data_loader/
├── IMPLEMENTATION_PLAN.md
├── sql/
│   ├── 01_create_tables.sql
│   └── 02_sample_data.sql
├── components/
│   ├── DataLoaderModal.js
│   ├── FileUploadStep.js
│   ├── FieldMappingStep.js
│   ├── DataPreviewStep.js
│   └── ProcessDataStep.js
├── utils/
│   ├── csvParser.js
│   ├── fieldMapper.js
│   └── dataValidator.js
└── README.md
```

## Technical Specifications

### File Upload
- **Max Size**: 25MB
- **Format**: CSV only
- **Validation**: File type, size, basic CSV structure

### Processing
- **Batch Size**: 100 rows per batch
- **Memory Management**: Stream processing for large files
- **Error Recovery**: Continue processing after errors

### User Experience
- **Wizard Flow**: 4 steps (Upload → Mapping → Preview → Process)
- **Auto-Mapping**: Suggest mappings based on field name similarity
- **Manual Override**: Drag-and-drop to override auto-mappings
- **Error Display**: Show errors in table format

## Success Metrics
- Support for 25MB CSV files
- 95%+ auto-mapping accuracy
- 1000+ rows per minute processing
- Comprehensive error logging
- Intuitive user interface

## Next Steps
1. Create database schema
2. Implement CSV parsing
3. Build file upload interface
4. Develop field mapping UI
5. Add data preview functionality
6. Implement import processing
7. Integrate with existing system
