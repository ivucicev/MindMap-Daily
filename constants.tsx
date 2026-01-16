
import { Interest, Achievement } from './types';

export const AVAILABLE_INTERESTS: Interest[] = [
  { id: 'psychology', name: 'Psychology', icon: '🧠', color: 'bg-rose-100 border-rose-200 text-rose-700' },
  { id: 'math', name: 'Math', icon: '🔢', color: 'bg-blue-100 border-blue-200 text-blue-700' },
  { id: 'physics', name: 'Physics', icon: '🌌', color: 'bg-indigo-100 border-indigo-200 text-indigo-700' },
  { id: 'quantum-physics', name: 'Quantum Physics', icon: '⚛️', color: 'bg-purple-100 border-purple-200 text-purple-700' },
  { id: 'game-dev', name: 'Game Development', icon: '🎮', color: 'bg-emerald-100 border-emerald-200 text-emerald-700' },
  { id: 'philosophy', name: 'Philosophy', icon: '🏛️', color: 'bg-amber-100 border-amber-200 text-amber-700' },
  { id: 'neuroscience', name: 'Neuroscience', icon: '🧬', color: 'bg-teal-100 border-teal-200 text-teal-700' },
  { id: 'economics', name: 'Economics', icon: '📈', color: 'bg-cyan-100 border-cyan-200 text-cyan-700' }
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', title: 'Curious Mind', icon: '🌱', description: 'Completed your first lesson' },
  { id: 'streak-3', title: 'Knowledge Seeker', icon: '🔥', description: 'Maintain a 3-day streak' },
  { id: 'polymath', title: 'Polymath', icon: '🎓', description: 'Learn from 5 different categories' },
  { id: 'bookworm', title: 'Bookworm', icon: '📚', description: 'Add 3 custom books or topics' }
];
