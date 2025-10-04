# AI Headshot Generator

A professional headshot generation application powered by AI. Upload your photos to train a personalized AI model and generate stunning professional headshots perfect for LinkedIn, resumes, and business profiles.

## Features

- **AI-Powered Generation**: Uses Astria AI to create professional headshots
- **Personalized Models**: Train custom AI models with your photos
- **Credit System**: Pay-per-generation credit system
- **Professional Templates**: Multiple headshot styles and backgrounds
- **User Management**: Secure authentication and user profiles
- **Admin Dashboard**: Complete admin interface for user and content management

## Setup Instructions

### Prerequisites

- Node.js 18+ or Bun runtime
- Supabase project
- Astria AI API key

### Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Fill in your configuration:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Astria AI Configuration  
VITE_ASTRIA_API_KEY=your_astria_api_key_here
```

### Database Setup

1. Run the database migrations in your Supabase project:
```bash
# Apply all migrations in order
supabase db reset
```

The migrations will create:
- User roles and permissions system
- Models table for AI model tracking
- Images table for generated headshots
- Credits system for usage tracking
- Samples table for training images

### Installation

**Option 1: Using Bun (Recommended)**
```bash
bun install
bun run dev
```

**Option 2: Using npm (if dependencies allow)**
```bash
npm install --legacy-peer-deps
npm run dev
```

## Usage

### User Flow

1. **Sign Up/Login**: Users authenticate via Supabase auth
2. **Upload Photos**: Upload 4-10 photos for AI model training
3. **Model Training**: AI trains a personalized model (5-10 minutes)
4. **Generate Headshots**: Create professional headshots with various prompts
5. **Download Results**: Download high-quality generated images

### Admin Features

- User management and role assignment
- Credit allocation and tracking  
- Content moderation
- Analytics and usage monitoring

## Technologies Used

This project is built with:

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage)
- **AI Service**: Astria AI for model training and image generation
- **State Management**: React Query for server state

## API Integration

### Astria AI Integration

The application integrates with Astria AI for:
- Custom model training with user photos
- Professional headshot generation
- Model status tracking and polling

### Supabase Integration

Features include:
- User authentication with magic links
- Row Level Security (RLS) for data protection
- Real-time subscriptions for status updates
- File storage for training samples

## Troubleshooting

### Installation Issues

If you encounter npm dependency conflicts:
```bash
# Clear cache and use legacy peer deps
npm cache clean --force
npm install --legacy-peer-deps --force
```

### Environment Variables

Ensure all required environment variables are set:
- Supabase URL and anonymous key
- Astria API key with proper permissions

### Database Issues

If database tables are missing, run migrations:
```bash
supabase migration up
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## License

This project is licensed under the MIT License.
