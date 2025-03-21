# HYDRA-AI Frontend

HYDRA-AI is a modern AI chat application built with React, TypeScript, and Tailwind CSS. The project utilizes the latest web technology stack to provide a smooth, responsive user experience.

## Features

- 🔐 User authentication system
- 💬 Real-time AI chat functionality
- 🎨 Modern UI, using Tailwind CSS and Shadcn components
- 📱 Responsive design, compatible with various devices
- 🚀 Built with Vite, providing a fast development experience

## Tech Stack

- **Framework**: React 18
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI / Shadcn
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Language**: TypeScript
- **Animation**: Framer Motion

## Development Environment Setup

### Prerequisites

- Node.js (Recommended v18+)
- pnpm (v10+)

### Installation

1. Clone the repository

```bash
git clone https://your-repository-url/hydra-front.git
cd hydra-front
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

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/         # React contexts
├── hooks/            # Custom React hooks
├── layouts/          # Layout components
├── lib/              # General utility functions
├── pages/            # Page components
├── types/            # TypeScript type definitions
├── App.tsx           # Main application component
├── Login.tsx         # Login page
├── index.css         # Global styles
└── main.tsx          # Application entry point
```

## Development Guide

### Adding a new page

1. Create a new page component in the `src/pages` directory
2. Add a new route to `src/App.tsx` for the new page

### Style Guide

The project uses Tailwind CSS, following these conventions:

- Use Tailwind classes for styling
- Use custom classes to extend Tailwind, such as `.text-shadow-white` and `.text-shadow-blue`

## Troubleshooting

### API connection issues

Ensure your `.env.local` file has the correct API endpoint configuration. For development, you may need to resolve CORS issues.

### Build failed

If the build fails, please try the following steps:

1. Delete the `node_modules` and `dist` directories
2. Reinstall dependencies: `pnpm install`
3. Rebuild: `pnpm build`

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

### Frontend Integration Example

```javascript
// Frontend code example using fetch
async function chatWithAgent(userMessage) {
  const response = await fetch('/agent/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: userMessage }
      ],
      stream: true
    })
  });

  // Process streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // Process complete SSE messages
    const lines = buffer.split('\n\n');
    buffer = lines.pop();
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      const [eventType, eventData] = line.split('\n');
      const type = eventType.replace('event: ', '');
      const data = JSON.parse(eventData.replace('data: ', ''));
      
      // Process different responses based on event type
      if (type === 'stage') {
        console.log(`Stage: ${data.stage} - Status: ${data.status}`);
        updateProgressIndicator(data.stage, data.status);
      } else if (type === 'content') {
        if (data.choices[0].delta.content) {
          appendToResponse(data.choices[0].delta.content);
        }
      } else if (type === 'error') {
        console.error(data.error);
        showError(data.error.message);
      } else if (type === 'done') {
        finishResponse();
      }
    }
  }
}
```

## Contribution

Welcome to contribute! Please follow the following steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

[Apache 2.0](LICENSE) 