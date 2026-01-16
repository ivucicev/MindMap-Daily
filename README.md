
# ⌬ MindMap Daily

> **Your Neural Learning Path, Synthesized Daily.**

MindMap Daily is an AI-powered intellectual companion that generates personalized micro-lessons based on your specific interests. Using Gemini 3 Flash, it transforms complex subjects into digestible insights, building a "mental web" of interconnected knowledge.

## 🚀 Live Demo
Access the application here: [https://mindmap.github.io](https://mindmap.github.io)

## ✨ Key Features

- **Intellectual Scope Definition**: Select from core disciplines (Psychology, Physics, Game Dev) or add your own custom books and niche topics.
- **AI-Driven Synthesis**: Uses the `@google/genai` SDK to generate original, focused lesson content.
- **Neural Linking**: Bridges concepts between different sessions to show how disparate fields of study actually relate.
- **Progress Tracking**: Gamified XP system, category-specific levels, and daily streaks.
- **Contextual Suggestions**: AI suggests new areas of study based on your current intellectual profile.

## 🛠️ Technical Implementation

- **Frontend**: React 19 (ES6 Modules)
- **AI Model**: Gemini 3 Flash Preview (configured for JSON output)
- **Styling**: Tailwind CSS with custom Dark/Light modes
- **Persistence**: Browser-native `localStorage` for profiles and lesson history
- **Deployment**: Configured for seamless hosting via **GitHub Pages**

## 📦 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mindmap/mindmap-daily.git
   cd mindmap-daily
   ```

2. **Environment Setup**:
   Ensure you have an API key from [Google AI Studio](https://aistudio.google.com/). The app expects `process.env.API_KEY` to be available.

3. **Install & Run**:
   ```bash
   npm install
   npm start
   ```

## 🚢 Deployment to GitHub Pages

The project includes a deployment script. To host it on your own GitHub account:

1. Update the `"homepage"` field in `package.json` to your own URL.
2. Run the deployment command:
   ```bash
   npm run deploy
   ```

## 📄 License
MIT License - feel free to use and adapt this for your own learning projects.
