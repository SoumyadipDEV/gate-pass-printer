# Gate Pass Printer

A modern web application for managing and printing gate passes for Suraksha Diagnostics Limited.

## Project Overview

The Gate Pass Printer is a comprehensive solution designed to streamline the process of creating, managing, and printing gate passes. It features user authentication, a form-based interface for entering visitor information, and a professional printing interface.

## Features

- User authentication with login/logout functionality
- Create and manage gate passes
- Preview gate passes before printing
- Print-friendly design with A4 support
- Responsive UI for desktop and mobile devices
- Professional design with Suraksha Diagnostics branding

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd gate-pass-printer

# Step 3: Install the necessary dependencies.
npm install

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Development

To start the development server:

```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Technologies Used

This project is built with:

- **Vite** - Next generation frontend tooling
- **TypeScript** - JavaScript with syntax for types
- **React** - UI library
- **React Router** - Client-side routing
- **shadcn-ui** - Reusable UI components
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **React to Print** - Print functionality

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components (Login, Index)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── hooks/           # Custom React hooks
├── assets/          # Static assets
└── main.tsx         # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Authentication

The application includes a login system. Demo credentials can be used with any email and password combination for testing purposes.

## Deployment

Build the application for production:

```sh
npm run build
```

The production files will be generated in the `dist` directory.
