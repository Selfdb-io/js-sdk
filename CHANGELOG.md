# Changelog

All notable changes to the SelfDB JavaScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2025-01-03

### Added
- Added `files` property to the main SelfDB class for direct access to FileClient functionality
- FileClient can now be accessed via `selfdb.files` in addition to importing it separately
- Improved developer experience by providing consistent access pattern across all client modules

### Changed
- Enhanced SelfDB class constructor to instantiate FileClient alongside other client modules

## [1.0.3] - 2025-06-03

### Changed
- **BREAKING**: Updated file deletion to use unified backend endpoint instead of direct storage service calls
- **BREAKING**: `FileClient.deleteFile()` now only requires `fileId` parameter (removed `bucketId` requirement)
- **BREAKING**: `StorageClient.delete()` now only requires `fileId` parameter (removed `bucket` requirement)
- File deletion now properly handles both database metadata and storage service cleanup in a single operation
- Added exports for `FileClient`, `BucketClient`, and `StorageClient` classes for direct access

### Fixed
- Fixed 404 errors when deleting files due to incorrect storage service endpoint usage
- Fixed file deletion not properly removing both metadata and physical files
- Improved error handling for file deletion operations

### Added
- Direct access to storage client classes for advanced use cases

## [1.1.0] - 2024-12-28

### Changed
- **BREAKING**: Updated database client to use tables endpoints exclusively instead of SQL endpoints for CRUD operations
- Updated `QueryBuilder.update()` method to use `/api/v1/tables/{table}/data/{id}` endpoint with proper query parameters
- Updated `QueryBuilder.delete()` method to use `/api/v1/tables/{table}/data/{id}` endpoint with proper query parameters
- Updated `DatabaseClient.create()`, `read()`, `update()`, `delete()` methods to use tables endpoints
- Updated `DatabaseClient.paginate()` method to use tables endpoint with proper metadata handling
- Simplified error handling and improved type safety for table operations

### Fixed
- Fixed TypeScript errors in order by clause handling
- Removed unused SQL-based methods from database client
- Improved null safety checks in array operations

### Notes
- Update and delete operations now require simple id-based where conditions for safety
- Complex where clauses with multiple conditions are not yet supported in this version
- SQL execution is still available via `executeSql()` method for advanced use cases

## [1.0.0] - 2024-01-23

### Added
- Initial release of SelfDB JavaScript SDK
- **Authentication Module**: Login, register, token refresh, logout, and anonymous access
- **Database Module**: CRUD operations, raw SQL queries, table management, and pagination
- **Storage Module**: Bucket and file management with upload/download capabilities
- **Realtime Module**: WebSocket connections for live data synchronization
- **Functions Module**: Cloud function invocation and management
- **Error Handling**: Comprehensive error types for different scenarios
- **Type Safety**: Full TypeScript support with detailed type definitions
- **Auto-retry Logic**: Built-in retry mechanism with exponential backoff
- **Universal Support**: Compatible with browsers, Node.js, and serverless environments

### Features
- Framework-agnostic design (works with React, Vue, Angular, or vanilla JS)
- Built-in authentication interceptors for automatic token management
- Support for both authenticated and anonymous API access
- Streaming file uploads and downloads
- Automatic reconnection for WebSocket connections
- Comprehensive test suite with 90%+ coverage
- ESM and CommonJS builds for broad compatibility
- Minified production builds

### Technical Highlights
- Built with TypeScript for type safety
- Uses tsup for optimized bundling
- Axios for HTTP client with retry logic
- WebSocket API for realtime features
- Comprehensive JSDoc documentation
- Vitest for testing with jsdom environment