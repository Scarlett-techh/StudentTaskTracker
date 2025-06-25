# Student Learning Platform - Architecture Overview

## Overview

This is a comprehensive student learning platform built as a full-stack web application. The platform enables students to track their learning tasks, upload photos of their work, take notes, and monitor their progress through gamification features. It also includes a coach dashboard for educators to assign tasks and monitor student progress.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Uploads**: Multer for handling multipart form data
- **API Design**: RESTful API with JSON responses

### Project Structure
- **Monorepo Setup**: Single repository with separate client and server directories
- **Shared Types**: Common schema definitions in `/shared` directory
- **Modular Components**: Organized by feature with reusable UI components

## Key Components

### Authentication System
- **Student Login**: Username/password authentication with registration
- **Coach Login**: Separate authentication flow for educators
- **Session Management**: Cookie-based sessions with Express
- **Password Reset**: Email-based password recovery system

### Task Management
- **Task Creation**: Students can create tasks with subjects, due dates, and resource links
- **AI Categorization**: OpenAI integration for automatic task subject classification
- **Drag & Drop**: Reorderable task lists with priority management
- **Status Tracking**: Pending, in-progress, and completed task states
- **File Attachments**: Support for uploading files with tasks

### Gamification Features
- **Points System**: Students earn points for completing tasks
- **Level Progression**: Automatic level increases based on points earned
- **Streak Tracking**: Daily activity streaks to encourage consistency
- **Achievements**: Badge system for reaching milestones
- **Progress Analytics**: Visual charts showing learning progress

### Content Management
- **Photo Portfolio**: Upload and organize photos of work with descriptions
- **Notes System**: Rich text notes with subject categorization
- **Resource Library**: Curated educational resources and links
- **Calendar Integration**: FullCalendar for task scheduling and due dates

### Coach Dashboard
- **Student Management**: View and assign tasks to students
- **Progress Monitoring**: Track student completion rates and engagement
- **Mood Tracking**: Monitor student emotional state through mood entries
- **Bulk Operations**: Assign tasks to multiple students simultaneously

## Data Flow

### Client-Server Communication
1. **API Requests**: Client uses TanStack Query for data fetching with automatic caching
2. **Form Submissions**: React Hook Form validates data before sending to server
3. **File Uploads**: FormData objects sent directly without JSON serialization
4. **Real-time Updates**: Query invalidation for immediate UI updates

### Database Operations
1. **Schema Definition**: Drizzle schema defines TypeScript types and database structure
2. **Query Building**: Type-safe queries using Drizzle ORM
3. **Migrations**: Database schema changes managed through Drizzle Kit
4. **Connection Pool**: Neon serverless connection pooling for scalability

### Data Processing Pipeline
1. **Input Validation**: Zod schemas validate all incoming data
2. **AI Enhancement**: OpenAI API categorizes tasks automatically
3. **Business Logic**: Server processes requests with appropriate permissions
4. **Response Formatting**: Consistent JSON responses with error handling

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **ORM**: Drizzle ORM for type-safe database operations
- **AI Service**: OpenAI GPT-4 for task categorization and recommendations
- **Email Service**: SendGrid for password reset emails (configured but using test transport)

### UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization
- **Calendar**: FullCalendar for scheduling interface
- **Form Validation**: Zod for runtime type checking

### Development Tools
- **Build Tool**: Vite with React plugin for fast development
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting (implicit)
- **Path Mapping**: TypeScript path aliases for clean imports

## Deployment Strategy

### Build Process
- **Frontend Build**: Vite bundles React app for production
- **Backend Build**: ESBuild compiles TypeScript server code
- **Static Assets**: Frontend assets served from `/dist/public`
- **Environment Variables**: Database URL and API keys from environment

### Hosting Platform
- **Platform**: Replit with autoscale deployment target
- **Port Configuration**: Server runs on port 5000, exposed as port 80
- **Module System**: Node.js 20 with PostgreSQL 16 module
- **Process Management**: npm scripts for development and production

### Database Management
- **Schema Deployment**: `drizzle-kit push` for schema updates
- **Connection Management**: Serverless connection pooling
- **Environment Isolation**: Separate databases for development/production

Changelog:
- June 25, 2025. Initial setup

User Preferences:
Preferred communication style: Simple, everyday language.