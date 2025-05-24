# LearnLoop Frontend

This is the frontend application for LearnLoop, built with [Next.js](https://nextjs.org) and bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- Interactive learning graph visualization using `react-force-graph-2d`
- Real-time voice conversations with OpenAI's GPT-4o
- User authentication via Supabase
- Responsive UI with Tailwind CSS
- Topic news research and display

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, create a `.env` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
frontend/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions and API clients
├── public/          # Static assets
└── styles/          # Global styles
```

## Key Components

- `LearningGraph.tsx`: Interactive force-directed graph for visualizing learning topics
- `VoiceConversation.tsx`: Real-time voice chat interface
- `NewsModal.tsx`: Display recent news and research about topics
- `AuthProvider.tsx`: Supabase authentication context
- `InterestInput.tsx`: Initial topic selection interface

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
