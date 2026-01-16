
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lesson, UserProfile } from './types';
import { generateLesson } from './services/geminiService';
import InterestSelector from './components/InterestSelector';
import LessonCard from './components/LessonCard';
import GitHubView from './components/GitHubView';
import { ACHIEVEMENTS, AVAILABLE_INTERESTS } from './constants';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('mindmap_theme') as 'dark' | 'light') || 'dark';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mindmap_user');
    const defaultProfile = { 
      interests: [], 
      customInterests: [], 
      history: [], 
      streak: 0, 
      totalPoints: 0, 
      unlockedAchievements: [],
      categoryProgress: {} 
    };
    if (!saved) return defaultProfile;
    const parsed = JSON.parse(saved);
    return { ...defaultProfile, ...parsed };
  });

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'onboarding' | 'lesson' | 'history' | 'achievements' | 'github'> (
    (user.interests.length > 0 || (user.customInterests && user.customInterests.length > 0)) ? 'lesson' : 'onboarding'
  );

  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light');
    localStorage.setItem('mindmap_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mindmap_user', JSON.stringify(user));
  }, [user]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const updateGamification = useCallback((newLesson: Lesson) => {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();

    setUser(prev => {
      let newStreak = prev.streak;
      if (prev.lastLessonDate === yesterdayString) {
        newStreak += 1;
      } else if (prev.lastLessonDate !== today) {
        newStreak = 1;
      }

      const pointsForLesson = 10;
      const newPoints = prev.totalPoints + pointsForLesson;
      const newAchievements = [...prev.unlockedAchievements];

      const catRef = newLesson.categoryRef;
      const currentCatXP = (prev.categoryProgress?.[catRef] || 0) + pointsForLesson;
      const newCategoryProgress = {
        ...(prev.categoryProgress || {}),
        [catRef]: currentCatXP
      };

      if (!newAchievements.includes('first-step')) newAchievements.push('first-step');
      if (newStreak >= 3 && !newAchievements.includes('streak-3')) newAchievements.push('streak-3');
      
      return {
        ...prev,
        streak: newStreak,
        lastLessonDate: today,
        totalPoints: newPoints,
        unlockedAchievements: newAchievements,
        history: [...prev.history, newLesson],
        categoryProgress: newCategoryProgress
      };
    });
  }, []);

  const loadNextLesson = useCallback(async () => {
    setLoading(true);
    try {
      const combined = [...user.interests, ...(user.customInterests || [])];
      if (combined.length === 0) {
        setView('onboarding');
        return;
      }
      const targetCategory = combined[Math.floor(Math.random() * combined.length)];
      const lastLesson = user.history[user.history.length - 1];
      const nextLesson = await generateLesson(targetCategory, combined, lastLesson);
      setCurrentLesson(nextLesson);
      updateGamification(nextLesson);
      setView('lesson');
    } catch (error) {
      console.error("Failed to generate lesson:", error);
    } finally {
      setLoading(false);
    }
  }, [user.interests, user.customInterests, user.history, updateGamification]);

  const navItemClass = (active: boolean) => `flex items-center gap-2 px-5 py-3 rounded-2xl transition-all ${
    active 
      ? (theme === 'dark' ? 'bg-white text-black font-bold scale-105 shadow-xl' : 'bg-slate-900 text-white font-bold scale-105 shadow-xl')
      : (theme === 'dark' ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100')
  }`;

  const groupedHistory = useMemo(() => {
    const groups: Record<string, Lesson[]> = {};
    user.history.forEach(lesson => {
      const cat = lesson.categoryRef;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(lesson);
    });
    return groups;
  }, [user.history]);

  return (
    <div className="min-h-screen flex flex-col pb-24 sm:pb-0">
      <header className="px-6 py-6 flex justify-between items-center max-w-6xl mx-auto w-full z-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('lesson')}>
          <div className={`w-10 h-10 ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-900 text-white'} rounded-xl flex items-center justify-center font-black text-xl shadow-2xl transition-colors`}>M</div>
          <div className="hidden xs:block">
            <h1 className={`font-bold text-lg tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>MindMap</h1>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Neural Logs</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setView('github')} 
             className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-900'}`}
           >
             Docs
           </button>
           <button onClick={toggleTheme} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}>
             <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span>
           </button>
           <div className={`${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/80' : 'bg-slate-100 border-slate-200 text-slate-700'} border px-3 py-1.5 rounded-full flex items-center gap-2`}>
             <span className="text-orange-400 text-xs">🔥</span>
             <span className="text-xs font-bold">{user.streak}</span>
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center px-4 relative">
        {view === 'onboarding' && (
          <InterestSelector 
            selected={user.interests} 
            customInterests={user.customInterests || []}
            onToggle={(id) => setUser(prev => ({...prev, interests: prev.interests.includes(id) ? prev.interests.filter(i => i !== id) : [...prev.interests, id]}))} 
            onAddCustom={(name) => !user.customInterests?.includes(name) && setUser(prev => ({...prev, customInterests: [...(prev.customInterests || []), name]}))}
            onRemoveCustom={(name) => setUser(prev => ({...prev, customInterests: (prev.customInterests || []).filter(i => i !== name)}))}
            onConfirm={() => { 
              if(user.history.length === 0) {
                loadNextLesson();
              } else {
                setView('lesson');
              }
            }}
          />
        )}

        {view === 'lesson' && currentLesson && (
          <LessonCard lesson={currentLesson} onNext={loadNextLesson} isLoading={loading} />
        )}

        {view === 'lesson' && !currentLesson && !loading && (
          <div className="text-center space-y-8 animate-in fade-in zoom-in-90 max-w-sm">
             <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xl'} rounded-[40px] flex items-center justify-center text-5xl mx-auto border`}>
               <span className="animate-pulse">⌬</span>
             </div>
             <button 
               onClick={loadNextLesson} 
               className={`w-full ${theme === 'dark' ? 'bg-white text-black hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-slate-800'} px-10 py-5 rounded-3xl font-black text-sm tracking-widest uppercase shadow-2xl transition-all active:scale-95`}
             >
               Pick Category & Start
             </button>
          </div>
        )}

        {view === 'history' && (
          <div className="max-w-6xl w-full space-y-12 animate-in slide-in-from-bottom-8 duration-700 pb-24">
            {Object.keys(groupedHistory).length === 0 && (
              <div className="text-center py-20 opacity-40">
                <span className="text-4xl block mb-4">📂</span>
                <p className="font-bold uppercase tracking-widest text-xs">No entries in the neural log yet.</p>
              </div>
            )}
            {Object.entries(groupedHistory).map(([catId, lessons]) => {
              const interest = AVAILABLE_INTERESTS.find(i => i.id === catId);
              const lessonsArray = lessons as Lesson[];
              return (
                <div key={catId} className="space-y-6">
                  <div className="flex items-center gap-4 px-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${interest?.color.split(' ')[0] || 'bg-indigo-500'}`}>
                      {interest?.icon || '📖'}
                    </div>
                    <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{interest?.name || catId}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessonsArray.map(l => (
                      <div key={l.id} className={`p-6 rounded-[32px] border ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'} transition-all cursor-pointer`} onClick={() => { setCurrentLesson(l); setView('lesson'); }}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>{l.date}</span>
                        <h3 className={`font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{l.title}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 p-4 z-30 sm:relative sm:p-6 sm:bg-transparent ${theme === 'dark' ? 'bg-black/80 backdrop-blur-xl border-t border-white/5' : 'bg-white/80 backdrop-blur-xl border-t border-slate-100'}`}>
        <div className="max-w-md mx-auto flex justify-between items-center sm:gap-4">
          <button onClick={() => setView('lesson')} className={navItemClass(view === 'lesson')}>
            <span className="text-xl">⚡️</span>
            <span className="hidden sm:inline text-xs tracking-widest uppercase">Current</span>
          </button>
          <button onClick={() => setView('history')} className={navItemClass(view === 'history')}>
            <span className="text-xl">📚</span>
            <span className="hidden sm:inline text-xs tracking-widest uppercase">Archives</span>
          </button>
          <button onClick={() => setView('onboarding')} className={navItemClass(view === 'onboarding')}>
            <span className="text-xl">⚙️</span>
            <span className="hidden sm:inline text-xs tracking-widest uppercase">Focus</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
