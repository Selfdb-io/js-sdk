# Changelog

All notable changes to the SelfDB JavaScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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