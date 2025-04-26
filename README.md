# HYDRA-AI Frontend

HYDRA-AI is a modern AI chat application built with React, TypeScript, and Tailwind CSS. The project utilizes the latest web technology stack to provide a smooth, responsive user experience for blockchain project analysis and AI assistant interactions.

## Features

- 🔐 User authentication system with token-based authorization and refresh functionality
- 💬 Real-time AI chat functionality with SSE (Server-Sent Events) streaming responses
- 🔍 Blockchain project analysis capabilities through specialized AI assistants
- 📊 Multi-stage processing visualization for complex analysis tasks
- 💾 Local chat history management with persistence
- 🔔 Toast notifications and error handling system
- 🎨 Modern UI using Tailwind CSS and Shadcn components
- 📱 Responsive design with specialized layouts for different devices (including iOS)
- 🚀 Built with Vite, providing a fast development experience
- 👛 Wallet connectivity features for blockchain interactions
- 💰 Solana payment integration with Phantom wallet
- 📱 iOS desktop simulation with window management
- 💸 Recharge and consumption history tracking

## Key Modules

- **iOS Desktop Experience**: Simulated iOS desktop interface with app window management, context menus, and theme switching
- **Solana Payment System**: Complete Solana blockchain integration for creating recharge orders, making payments, and tracking transaction history
- **AI Chat Interface**: Advanced chat system with message streaming, history persistence, and context management
- **Wallet Integration**: Phantom wallet connectivity for Solana blockchain interactions
- **Authentication System**: Secure user auth with token management

## Tech Stack

- **Framework**: React 18
- **Routing**: React Router v7
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI / Shadcn
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Language**: TypeScript
- **Animation**: Framer Motion
- **API Communication**: Fetch API with SSE support
- **Blockchain**: Solana Web3.js
- **Form Handling**: React Hook Form + Zod validation

## Development Environment Setup

### Prerequisites

- Node.js (Recommended v18+)
- pnpm (v10+)

### Installation

1. Clone the repository

```bash
git clone https://github.com/hydra-mcp/hydra-mcp-solana.git
cd hydra-mcp-solana
```

2. Install dependencies

```bash
pnpm install
```

3. Configure environment variables

Create a `.env.local` file (or edit the existing one):

```
VITE_API_BASE_URL=your_api_endpoint
```

4. Start the development server

```bash
pnpm dev
```

The application will run on [http://localhost:5173](http://localhost:5173).

## Application Structure

The application is organized into the following key components:

### Core Components

- **Chat Interface**: A full-featured chat UI with message history, streaming responses, and context management
- **Authentication System**: Login page with token-based authentication
- **Wallet Integration**: Connection to blockchain wallets for crypto interactions
- **Error Handling**: Global error boundary and API error handling system
- **iOS Desktop Simulation**: Interactive iOS-like desktop environment with window management
- **Solana Payment**: Complete payment flow with wallet connection, transaction processing, and history tracking

### Pages

- **Home**: Landing page showcasing available features and system capabilities
- **ChatPage**: Main chat interface with AI assistant
- **IOSDesktop**: iOS-like desktop environment with multiple app windows and interactions
- **SolanaPaymentPage**: Interface for Solana blockchain payments and recharge history

## Component Organization

```
src/
├── components/        # Reusable UI components
│   ├── chat/          # Chat-related components
│   ├── ui/            # Core UI components (Shadcn)
│   ├── phantom/       # Wallet connection components
│   ├── ios/           # iOS-specific components
│   └── SolanaPayment/ # Solana payment flow components
├── contexts/          # React contexts for state management
├── hooks/             # Custom React hooks
├── layouts/           # Layout components
├── lib/               # Utility functions and API clients
│   ├── api.ts         # API communication layer
│   ├── sse.ts         # Server-Sent Events implementation
│   ├── walletService.ts # Wallet connection and management
│   └── utils.ts       # General utility functions
├── pages/             # Application pages
├── types/             # TypeScript type definitions
├── App.tsx            # Main application component with routes
├── Login.tsx          # Authentication page
└── main.tsx           # Application entry point
```

## Build and Deployment

### Production Build

```bash
pnpm build
```

The built files will be located in the `dist` directory.

### Deployment Process

#### Using Caddy Server (Recommended)

1. Install Caddy Server
   
   Please refer to the [Caddy official documentation](https://caddyserver.com/docs/install) for installation.

2. Configure Caddyfile

   Create or edit the Caddyfile:

   ```
   your-domain.com {
     root * /path/to/hydra-front/dist
     
     # Set up SPA routing
     try_files {path} {path}/ /index.html
     
     # Define static resource matcher
     @static {
       path *.css *.js *.ico *.gif *.jpg *.jpeg *.png *.svg *.webp *.woff *.woff2
     }
     
     # Static resource cache settings
     header @static Cache-Control "public, max-age=31536000, immutable"
     
     # HTML file cache settings
     @html {
       path *.html
     }
     header @html Cache-Control "no-cache, no-store, must-revalidate"
     
     # API proxy settings (if needed)
     reverse_proxy /api/* your_backend_api_server
     
     # Enable file server
     file_server
   }
   ```

3. Start Caddy Server

   ```bash
   caddy run
   ```

#### Using Docker Deployment

1. Use Dockerfile

   The project already includes a Dockerfile, which can be built directly:

   ```bash
   docker build -t hydra-front .
   docker run -d -p 80:80 hydra-front
   ```

2. Use docker-compose

   The project provides a docker-compose.yml file, which can be used to deploy both the frontend and backend:

   ```bash
   # Start the service
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop the service
   docker-compose down
   ```

   Note: Please adjust the configuration in docker-compose.yml according to your actual situation before using it.

## Environment Variables

- `VITE_API_BASE_URL`: API server base URL
- `VITE_BASE_URL`: Optional alternative API base URL (for development/testing)

## API Documentation

HYDRA-AI frontend uses the `/agent/chat/completions` API endpoint to interact with the AI assistant, implementing blockchain project analysis functionality. This API is similar to the structure of OpenAI's Chat Completions API, suitable for frontend developers familiar with LLM APIs. For the complete API documentation, please refer to [API documentation](API.md).

### Endpoint

```
POST /agent/chat/completions
```

### Authentication
- Requires an authenticated user session
- Uses JWT authentication (managed by the `get_current_active_user` dependency)

### Request Format

```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Analyze the project at address 0x123..."
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 1024,
  "project_context": {
    "additional_context": "any relevant context"
  }
}
```

### Response Types

API provides two response modes:
1. **Non-streaming response** - Full response returned once
2. **Streaming response** - Returned in Server-Sent Events (SSE) format, containing the following event types:
   - **Stage event** - Represents different stages of the analysis process
   - **Content event** - Passes actual content blocks
   - **Error event** - Passes error information
   - **Done event** - Represents the end of the stream

## Contribution

Welcome to contribute! Please follow the following steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

[Apache 2.0](LICENSE) 