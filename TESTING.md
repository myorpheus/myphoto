# Testing Documentation

## Overview

This document outlines the testing strategy and requirements for the MyPhoto application. Unit tests are needed for the Phase 2 refactored code to ensure maintainability and prevent regressions.

## Testing Framework Setup

### Required Dependencies

```bash
npm install -D vitest @vitest/ui jsdom
```

### Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Add test script to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Test Files Structure

```
src/
├── services/
│   ├── headshotGeneratorService.ts
│   ├── headshotGeneratorService.test.ts
│   ├── userService.test.ts
│   ├── modelService.test.ts
│   ├── imageService.test.ts
│   ├── creditService.test.ts
│   └── sampleService.test.ts
├── hooks/
│   ├── useHeadshotGenerator.ts
│   ├── useHeadshotGenerator.test.ts
│   ├── useGalleryData.ts
│   └── useGalleryData.test.ts
├── components/
│   ├── FilterBar.tsx
│   ├── FilterBar.test.tsx
│   ├── ImageGrid.tsx
│   └── ImageGrid.test.tsx
└── test/
    ├── setup.ts
    └── mocks/
        ├── supabase.ts
        └── fetch.ts
```

## Priority Test Coverage

### 1. headshotGeneratorService.ts (HIGH PRIORITY)

**File:** `src/services/headshotGeneratorService.test.ts`

#### Test Cases

##### trainModel
- ✅ Should convert images to base64 successfully
- ✅ Should call edge function with correct parameters
- ✅ Should return success response with tune_id
- ❌ Should throw error on failed API call
- ❌ Should throw error when tune_id is missing

##### checkModelStatus
- ✅ Should call edge function with correct tune_id
- ✅ Should return status response
- ❌ Should throw error on failed API call
- ❌ Should handle missing status field

##### generateImage
- ✅ Should call edge function with all parameters
- ✅ Should include style and gender in request
- ✅ Should return success with images array
- ❌ Should throw error on failed generation
- ❌ Should handle missing images in response

##### Database Operations
- ✅ Should create model record with correct data
- ✅ Should create sample records for each image
- ✅ Should get model images by ID
- ✅ Should update model status
- ❌ Should handle database errors gracefully

##### Auth Operations
- ✅ Should get current user
- ✅ Should get user credits by user ID
- ✅ Should get access token from session
- ❌ Should throw error when no active session
- ❌ Should handle authentication errors

##### downloadImage
- ✅ Should fetch image successfully
- ✅ Should create download link
- ✅ Should trigger browser download
- ❌ Should throw error on failed fetch
- ❌ Should clean up object URLs

#### Mock Setup

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { headshotGeneratorService } from './headshotGeneratorService';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock completeSupabaseService
vi.mock('./supabase-complete', () => ({
  completeSupabaseService: {
    createModel: vi.fn(),
    createSample: vi.fn(),
    getModelImages: vi.fn(),
    updateModel: vi.fn(),
    getCurrentUser: vi.fn(),
    getUserCredits: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();
```

### 2. useGalleryData.ts Hook (MEDIUM PRIORITY)

**File:** `src/hooks/useGalleryData.test.ts`

#### Test Cases

- ✅ Should initialize with correct default state
- ✅ Should load gallery data on mount
- ✅ Should filter images by search term
- ✅ Should filter images by status
- ✅ Should sort images by newest/oldest/prompt
- ✅ Should monitor image expiries
- ✅ Should call downloadWithResolution correctly
- ✅ Should extend image life
- ❌ Should handle authentication errors
- ❌ Should handle loading errors

### 3. FilterBar Component (LOW PRIORITY)

**File:** `src/components/FilterBar.test.tsx`

#### Test Cases

- ✅ Should render search input
- ✅ Should render status filter dropdown
- ✅ Should render sort by dropdown
- ✅ Should call setSearchTerm on input change
- ✅ Should call setStatusFilter on selection
- ✅ Should call setSortBy on selection
- ✅ Should display current values correctly

### 4. ImageGrid Component (LOW PRIORITY)

**File:** `src/components/ImageGrid.test.tsx`

#### Test Cases

- ✅ Should render grid view correctly
- ✅ Should render list view correctly
- ✅ Should display image expiry information
- ✅ Should show download options on hover
- ✅ Should call downloadWithResolution on click
- ✅ Should call handleExtendImageLife on click
- ✅ Should render empty state when no images

### 5. Service Modules (MEDIUM PRIORITY)

Test files needed:
- `userService.test.ts`
- `modelService.test.ts`
- `imageService.test.ts`
- `creditService.test.ts`
- `sampleService.test.ts`

Each should test:
- ✅ All CRUD operations
- ✅ Correct Supabase queries
- ❌ Error handling
- ❌ RLS policy compliance

## Testing Best Practices

### 1. Mock External Dependencies

Always mock:
- Supabase client
- Fetch API
- Browser APIs (window.URL, document)
- Environment variables

### 2. Test Error Paths

Don't just test happy paths:
- Network failures
- Authentication errors
- Invalid data
- Missing required fields
- Rate limiting
- Timeout errors

### 3. Test Edge Cases

Consider:
- Empty arrays
- Null/undefined values
- Very large datasets
- Concurrent operations
- Race conditions

### 4. Use Descriptive Test Names

```typescript
// ✅ Good
it('should throw error when API key is missing')

// ❌ Bad
it('throws error')
```

### 5. Arrange-Act-Assert Pattern

```typescript
it('should create model record', async () => {
  // Arrange
  const mockUser = { id: 'user-123' };
  const mockModelId = 456;

  // Act
  const result = await headshotGeneratorService.createModelRecord(
    mockUser.id,
    mockModelId,
    'test-model'
  );

  // Assert
  expect(result).toBeDefined();
  expect(result.user_id).toBe(mockUser.id);
  expect(result.astria_model_id).toBe(mockModelId);
});
```

## Coverage Goals

- **Minimum:** 70% code coverage
- **Target:** 80% code coverage
- **Critical paths:** 90% coverage (auth, payment, generation)

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test headshotGeneratorService.test.ts
```

## Continuous Integration

Tests should run:
- On every pull request
- Before merging to main
- On main branch commits
- Nightly for full test suite

## Next Steps

1. ✅ Install Vitest and dependencies
2. ✅ Create vitest.config.ts
3. ✅ Create test setup file
4. ✅ Write headshotGeneratorService tests (highest priority)
5. ⏳ Write useGalleryData tests
6. ⏳ Write component tests
7. ⏳ Write service module tests
8. ⏳ Achieve 70%+ coverage
9. ⏳ Add CI/CD integration

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
