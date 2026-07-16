# AgriAI 2.0

**Intelligent Farming Assistant for Ghana**  
Built with modern technologies and deployed on Render.com.

## Features

- **White Mode + Perplexity-style UI**
- **Web Search** (Tavily)
- **Voice Input** (OpenAI Whisper)
- **Voice Output** (ElevenLabs)
- **Expert Mode**
- **Agent Mode**
- **Multi-language Support** (Twi, Ga, Ewe, Hausa, English, etc.)
- **Full Admin Panel** (WordPress-style with database)
- **Crop Disease Detection**
- **Market Prices & Recommendations**

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind
- **Backend**: Node.js + Prisma + PostgreSQL
- **AI**: Groq (Llama 3.3 70B) + OpenAI Whisper + ElevenLabs
- **Deployment**: Render.com

## Environment Variables

Create a `.env.local` file with the following keys:

```env
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
TAVILY_API_KEY=your_tavily_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
DATABASE_URL=your_database_url
```

## Local Development

```bash
npm install
npx prisma generate
npm run dev
```

## Deployment on Render.com

1. Push this repository to GitHub
2. Create a new **Blueprint** on Render.com
3. Render will automatically create:
   - Web Service
   - PostgreSQL Database
4. Add your API keys in the Environment Variables section

## Admin Panel

Access the admin panel at `/admin`

- Edit Hero Title & Subtitle
- Change Primary Color
- Toggle Features (Voice, Expert Mode, etc.)
- All changes are saved to the database

## Team

- Nana Ware Henry Opoku (Chief Programmer & Full Stack Developer)
- Thaddeus Nii Teiko Tagoe (Overseer & Programmer)
- Comfort Poedza (Finance & Operations)
- Edmond Nana Yaw Boateng (Algorithms & AI)

---

**University of Ghana • 2026**