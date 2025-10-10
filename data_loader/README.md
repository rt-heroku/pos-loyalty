# Data Loader Feature

## Overview
The Data Loader feature allows users to upload CSV files and import product or customer data into the POS system through an intuitive wizard interface.

## Features
- **File Upload**: Drag-and-drop or select CSV files (up to 25MB)
- **Auto-Mapping**: Intelligent field mapping based on name similarity
- **Manual Override**: Drag-and-drop interface for custom field mapping
- **Data Preview**: Review mapped data before import
- **Error Handling**: Comprehensive error logging and display
- **Progress Tracking**: Status updates during import process

## File Structure
```
data_loader/
├── IMPLEMENTATION_PLAN.md    # Detailed implementation plan
├── sql/
│   ├── 01_create_tables.sql  # Database schema
│   └── 02_sample_data.sql    # Sample data for testing
├── components/               # Frontend components (to be created)
├── utils/                    # Utility functions
│   ├── csvParser.js         # CSV parsing logic
│   ├── fieldMapper.js       # Field mapping logic
│   └── dataValidator.js     # Data validation logic
└── README.md                # This file
```

## Database Schema

### Tables Created
1. **data_loader_jobs** - Tracks import jobs and their status
2. **data_loader_rows** - Stores individual CSV rows for processing
3. **data_loader_errors** - Logs errors encountered during import

### Key Features
- **Job Tracking**: Each import gets a unique job ID
- **Row Processing**: Individual row status tracking
- **Error Logging**: Detailed error information with field context
- **JSON Storage**: Flexible storage for CSV and mapped data

## Implementation Status

### ✅ Completed
- [x] Database schema design
- [x] CSV parsing utility
- [x] Field mapping logic
- [x] Data validation framework
- [x] Auto-mapping algorithm
- [x] Error handling structure

### 🚧 In Progress
- [ ] Backend API endpoints
- [ ] Frontend components
- [ ] File upload interface
- [ ] Field mapping UI
- [ ] Data preview functionality
- [ ] Import processing logic

### 📋 Pending
- [ ] Integration with existing system
- [ ] Testing and validation
- [ ] Documentation
- [ ] Deployment

## Usage Examples

### CSV Format Examples

#### Products CSV
```csv
SKU,Name,Category,Material,Color,Size,Price,WeightLbs,Dimensions,Features
SAM-JETSTREAM-0000,"Jetstream Carry-On 22"" Silver",Carry-On,Ballistic Nylon,Silver,"22""",234.37,7.48,28x20x12 in,Eco lining; USB port; Laptop sleeve; Expandable
```

#### Customers CSV
```csv
CustomerID,FirstName,LastName,Email,Phone,Region,Country,PreferredLanguage,LoyaltyTier,PointsBalance,Preferences,EngagementSource,DateOfBirth
C100000,Noa,Johnson,noa.johnson@example.com,+1-892-958-9935,London,UK,English,Bronze,1945,Business travel; Anti-theft,Email,1972-10-19
```

## Technical Specifications

### File Limits
- **Maximum Size**: 25MB
- **Format**: CSV only
- **Encoding**: UTF-8

### Processing
- **Batch Size**: 100 rows per batch
- **Memory Management**: Stream processing for large files
- **Error Recovery**: Continue processing after errors

### Validation
- **Required Fields**: Name, Price, Category (products); First Name, Last Name, Email (customers)
- **Data Types**: Automatic type conversion and validation
- **Business Rules**: Custom validation rules per field

## API Endpoints (Planned)

### File Upload
- `POST /api/data-loader/upload` - Upload CSV file

### Field Mapping
- `GET /api/data-loader/fields/:jobId` - Get CSV and database fields
- `POST /api/data-loader/mapping/:jobId` - Save field mapping

### Data Processing
- `GET /api/data-loader/preview/:jobId` - Preview mapped data
- `POST /api/data-loader/process/:jobId` - Execute import
- `GET /api/data-loader/status/:jobId` - Get job status
- `GET /api/data-loader/errors/:jobId` - Get import errors

## Error Handling

### Validation Errors
- Field type mismatches
- Required field missing
- Invalid data formats
- Business rule violations

### Import Errors
- Database constraint violations
- Duplicate key conflicts
- Foreign key constraint failures

### System Errors
- File parsing errors
- Database connection issues
- Memory limitations

## Future Enhancements

### Phase 2 Features
- Real-time progress tracking
- Advanced data transformations
- Custom validation rules
- Import scheduling
- Data export functionality

### Phase 3 Features
- API integration
- Cloud storage support
- Advanced mapping rules
- Data quality scoring
- Automated testing

## Development Notes

### Dependencies
- `csv-parser` - CSV file parsing
- `multer` - File upload handling
- `uuid` - Unique job ID generation

### Performance Considerations
- Stream processing for large files
- Batch database operations
- Memory management
- Index optimization

### Security Considerations
- File type validation
- Size limits
- Data sanitization
- Access control

## Testing

### Unit Tests
- CSV parsing accuracy
- Field mapping logic
- Data validation rules
- Error handling

### Integration Tests
- End-to-end import process
- Database operations
- API endpoints
- User interface

### Performance Tests
- Large file processing
- Memory usage
- Database performance
- Concurrent operations

## Deployment

### Prerequisites
- PostgreSQL database
- Node.js environment
- File upload middleware
- CSV parsing library

### Configuration
- File size limits
- Database connection
- Error logging
- Performance tuning

### Monitoring
- Job status tracking
- Error rate monitoring
- Performance metrics
- User activity logs
