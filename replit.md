# Student Learning Platform

## Overview

A comprehensive student learning platform built as a full-stack web application that enables students to track their learning tasks, upload photos of their work, take notes, build portfolios, and monitor progress through gamification. The platform features AI-powered task categorization, a coaching dashboard for educators, and personalized learning recommendations to enhance the educational experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**Framework**: React 18 with TypeScript for type safety and modern development practices
**Styling**: Tailwind CSS with a custom design system using shadcn/ui component library built on Radix UI primitives
**State Management**: TanStack Query (React Query) handles server state management and caching, eliminating need for complex client-side state solutions
**Routing**: Wouter provides lightweight client-side routing with simple API
**Forms**: React Hook Form with Zod validation ensures robust form handling and data validation
**Build System**: Vite for fast development server and optimized production builds

### Backend Architecture
**Runtime**: Node.js with Express.js framework provides RESTful API endpoints
**Language**: TypeScript with ES modules for consistent type safety across the stack
**Database Layer**: Drizzle ORM offers type-safe database operations with PostgreSQL
**File Handling**: Multer middleware manages multipart form data for file uploads
**AI Integration**: OpenAI API integration for automatic task categorization based on content analysis

### Authentication System
**Primary Authentication**: Replit Auth integration for seamless login experience in development environment
**Fallback Authentication**: Traditional username/password system with registration for broader compatibility
**Session Management**: Express sessions with PostgreSQL storage for persistence
**Role-Based Access**: Separate authentication flows for students and coaches with different permission levels

### Database Design
**Primary Database**: PostgreSQL with Neon Database as serverless provider
**Schema Management**: Drizzle Kit handles migrations and schema synchronization
**Data Organization**: Normalized schema with proper relationships between users, tasks, notes, photos, and achievements
**Session Storage**: Dedicated sessions table for authentication state management

### Gamification Engine
**Points System**: Students earn points for task completion with configurable point values
**Level Progression**: Automatic level increases based on accumulated points
**Achievement System**: Badge rewards for reaching specific milestones and completing challenges
**Streak Tracking**: Daily activity streaks encourage consistent engagement
**Learning Wallet**: Virtual reward system allowing students to earn certificates for achievements

### AI-Powered Features
**Task Categorization**: OpenAI GPT-4 automatically categorizes tasks into subjects based on title, description, and resource links
**Learning Recommendations**: AI-generated personalized learning suggestions based on completed task patterns
**Content Analysis**: Smart categorization considers educational platform domains and content types

### File Management
**Upload System**: Supports multiple file types including images, documents, and generic files
**Storage Strategy**: Base64 encoding for database storage with size limits (10MB per file)
**Preview Generation**: Built-in file preview system for common formats
**Attachment System**: Files can be attached to tasks, notes, and portfolio items

### Coach Dashboard
**Student Management**: Coaches can view and manage multiple student accounts
**Task Assignment**: Bulk task assignment to selected students with due dates
**Progress Monitoring**: Real-time visibility into student completion rates and mood tracking
**Mood Analytics**: Visual overview of student emotional states and engagement levels

### Portfolio System
**Work Showcase**: Students can organize completed work into portfolio items
**Multi-Media Support**: Supports photos, documents, links, and project descriptions
**Subject Organization**: Portfolio items categorized by academic subject
**Sharing Capabilities**: Built-in sharing features for showcasing achievements

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling and backup
- **Connection Pool**: @neondatabase/serverless provides WebSocket-based database connections

### AI Services  
- **OpenAI API**: GPT-4 model integration for task categorization and learning recommendations
- **Content Analysis**: Processes task titles, descriptions, and resource URLs for smart categorization

### UI Framework
- **Radix UI**: Headless UI primitives for accessible component foundation
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide Icons**: Consistent icon library throughout the application

### Authentication
- **Replit Auth**: OpenID Connect integration for development environment authentication
- **Passport.js**: Authentication middleware with OpenID Connect strategy

### Development Tools
- **Vite**: Fast build tool with hot module replacement for development
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds

### Email Services
- **Nodemailer**: Email sending capability for password reset functionality
- **Ethereal Email**: Development email testing service

### Calendar Integration
- **FullCalendar**: Interactive calendar component with drag-and-drop task scheduling
- **Date-fns**: Date manipulation and formatting utilities

### Chart Visualization
- **Recharts**: React charting library for analytics and progress visualization
- **Chart Types**: Bar charts, pie charts, and radar charts for different data representations