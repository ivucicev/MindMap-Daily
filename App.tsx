
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Lesson, UserProfile } from './types';
import { generateLesson } from './services/geminiService';
import InterestSelector from './components/InterestSelector';
import LessonCard from './components/LessonCard';
import { AVAILABLE_INTERESTS } from './constants';

const QUEUE_TARGET_SIZE = 3;

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('mindmap_theme') as 'dark' | 'light') || 'dark';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mindmap_user_v3');
    const defaultProfile: UserProfile = { 
      interests: [], 
      customInterests: [], 
      history: [], 
      lessonQueue: [],
      streak: 0, 
      totalPoints: 0, 
      unlockedAchievements: [],
      categoryProgress: {} 
    };
    if (!saved) return defaultProfile;
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultProfile, ...parsed };
    } catch (e) {
      return defaultProfile;
    }
  });

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [view, setView] = useState<'onboarding' | 'lesson' | 'history'>(
    (user.interests.length > 0 || (user.customInterests && user.customInterests.length > 0)) ? 'lesson' : 'onboarding'
  );

  const preloadingRef = useRef(false);

  useEffect(() => {
    document.body.classList.toggle('light-mode', theme === 'light');
    localStorage.setItem('mindmap_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mindmap_user_v3', JSON.stringify(user));
  }, [user]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const refillQueue = useCallback(async (forcedCategory?: string) => {
    if (preloadingRef.current) return;
    
    const combined = [...user.interests, ...(user.customInterests || [])];
    if (combined.length === 0) return;
    if (!forcedCategory && user.lessonQueue.length >= QUEUE_TARGET_SIZE) return;

    preloadingRef.current = true;
    setIsPreloading(true);
    
    try {
      const targetCategory = forcedCategory || combined[Math.floor(Math.random() * combined.length)];
      const lastReference = user.lessonQueue.length > 0 
        ? user.lessonQueue[user.lessonQueue.length - 1] 
        : user.history[user.history.length - 1];

      const nextLesson = await generateLesson(targetCategory, combined, lastReference);
      
      setUser(prev => ({
        ...prev,
        lessonQueue: forcedCategory ? [nextLesson, ...prev.lessonQueue] : [...prev.lessonQueue, nextLesson]
      }));
    } catch (error) {
      console.error("Refill failed:", error);
    } finally {
      preloadingRef.current = false;
      setIsPreloading(false);
    }
  }, [user.interests, user.customInterests, user.lessonQueue, user.history]);

  useEffect(() => {
    if (user.interests.length > 0 || user.customInterests.length > 0) {
      refillQueue();
    }
  }, [user.lessonQueue.length, user.interests, user.customInterests, refillQueue]);

  const toggleFavorite = useCallback((id: string) => {
    setUser(prev => ({
      ...prev,
      history: prev.history.map(l => l.id === id ? { ...l, isFavorite: !l.isFavorite } : l)
    }));
    setCurrentLesson(prev => (prev?.id === id ? { ...prev, isFavorite: !prev.isFavorite } : prev));
  }, []);

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
      const catRef = newLesson.categoryRef;
      
      const updatedCategoryProgress = { ...prev.categoryProgress };
      updatedCategoryProgress[catRef] = (updatedCategoryProgress[catRef] || 0) + pointsForLesson;
      
      return {
        ...prev,
        streak: newStreak,
        lastLessonDate: today,
        totalPoints: newPoints,
        history: [...prev.history, newLesson],
        categoryProgress: updatedCategoryProgress
      };
    });
  }, []);

  const advancePath = useCallback(async (categoryOverride?: string) => {
    // If "More like this" is clicked, bookmark current and generate specific one
    if (categoryOverride && currentLesson && !currentLesson.isFavorite) {
      toggleFavorite(currentLesson.id);
    }

    if (categoryOverride) {
      setLoading(true);
      try {
        const combined = [...user.interests, ...(user.customInterests || [])];
        const lastReference = user.history[user.history.length - 1];
        const nextLesson = await generateLesson(categoryOverride, combined, lastReference);
        setCurrentLesson(nextLesson);
        updateGamification(nextLesson);
        setView('lesson');
      } catch (error) {
        console.error("Failed override gen:", error);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (user.lessonQueue.length > 0) {
      const nextFromQueue = user.lessonQueue[0];
      const remainingQueue = user.lessonQueue.slice(1);
      setCurrentLesson(nextFromQueue);
      updateGamification(nextFromQueue);
      setUser(prev => ({ ...prev, lessonQueue: remainingQueue }));
      setView('lesson');
      return;
    }

    setLoading(true);
    setView('lesson');
    try {
      const combined = [...user.interests, ...(user.customInterests || [])];
      if (combined.length === 0) { setView('onboarding'); return; }
      const targetCategory = combined[Math.floor(Math.random() * combined.length)];
      const lastLesson = user.history[user.history.length - 1];
      const nextLesson = await generateLesson(targetCategory, combined, lastLesson);
      setCurrentLesson(nextLesson);
      updateGamification(nextLesson);
    } catch (error) {
      console.error("Failed next path:", error);
    } finally {
      setLoading(false);
    }
  }, [user.lessonQueue, user.interests, user.customInterests, user.history, updateGamification, currentLesson, toggleFavorite]);

  const navItemClass = (active: boolean) => `flex flex-col items-center justify-center gap-1 px-5 py-2 rounded-[22px] transition-all duration-300 ${
    active 
      ? (theme === 'dark' ? 'bg-white text-black font-bold shadow-lg scale-105' : 'bg-slate-900 text-white font-bold shadow-lg scale-105')
      : (theme === 'dark' ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100')
  }`;

  const filteredHistory = useMemo(() => {
    return filterFavorites ? user.history.filter(l => l.isFavorite) : user.history;
  }, [user.history, filterFavorites]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, Lesson[]> = {};
    filteredHistory.forEach(lesson => {
      const cat = lesson.categoryRef;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(lesson);
    });
    return groups;
  }, [filteredHistory]);

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-['Plus_Jakarta_Sans']">
      <header className="px-6 py-8 flex justify-between items-center max-w-6xl mx-auto w-full z-20">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('lesson')}>
          <div className={`w-11 h-11 ${theme === 'dark' ? 'bg-white text-black' : 'bg-slate-900 text-white'} rounded-xl flex items-center justify-center font-black text-xl transition-transform group-hover:scale-105`}>M</div>
          <div>
            <h1 className={`font-black text-lg tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>MindMap</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[9px] uppercase tracking-widest font-black ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Neural Network</span>
              {isPreloading && <span className="flex h-1 w-1 rounded-full bg-indigo-500 animate-pulse"></span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button onClick={toggleTheme} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-white border border-slate-100 hover:bg-slate-50 shadow-sm'}`}>
             {theme === 'dark' ? (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
               </svg>
             ) : (
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
               </svg>
             )}
           </button>
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/80' : 'bg-white border-slate-100 text-slate-700 shadow-sm'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-orange-400">
               <path fillRule="evenodd" d="M12.969 2.112a.75.75 0 0 1 .115.836l-9.425 19.125a.75.75 0 0 1-1.352-.614l3.109-8.424H3a.75.75 0 0 1-.712-1.013L11.963 1.011a.75.75 0 0 1 1.006-.111l-.001.001ZM12.75 12h5.25a.75.75 0 0 1 .712 1.013l-3.905 10.65a.75.75 0 1 1-1.408-.513l3.109-8.424H11.25a.75.75 0 0 1-.712-1.013l8.85-11.85a.75.75 0 0 1 1.2.928L12.75 12Z" clipRule="evenodd" />
             </svg>
             <span className="text-[11px] font-black">{user.streak}</span>
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 relative z-10 pb-36">
        {view === 'onboarding' && (
          <InterestSelector 
            selected={user.interests} 
            customInterests={user.customInterests || []}
            onToggle={(id) => setUser(prev => ({...prev, interests: prev.interests.includes(id) ? prev.interests.filter(i => i !== id) : [...prev.interests, id]}))} 
            onAddCustom={(name) => !user.customInterests?.includes(name) && setUser(prev => ({...prev, customInterests: [...(prev.customInterests || []), name]}))}
            onRemoveCustom={(name) => setUser(prev => ({...prev, customInterests: (prev.customInterests || []).filter(i => i !== name)}))}
            onConfirm={() => advancePath()}
          />
        )}

        {(view === 'lesson' || loading) && (
          <>
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-6">
                <div className={`w-16 h-16 border-4 border-t-indigo-500 rounded-full animate-spin ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}></div>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Synthesizing Intelligence...</p>
              </div>
            ) : currentLesson ? (
              <LessonCard 
                lesson={currentLesson} 
                onNext={() => advancePath()} 
                onMoreLikeThis={() => advancePath(currentLesson.categoryRef)}
                onToggleFavorite={toggleFavorite}
                isLoading={loading} 
              />
            ) : (
               <div className="text-center py-20 space-y-10 animate-in fade-in zoom-in-95 max-w-sm">
                  <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-xl'} rounded-[40px] flex items-center justify-center text-5xl mx-auto border`}>
                    <span className="animate-pulse">⌬</span>
                  </div>
                  <button onClick={() => advancePath()} className={`w-full ${theme === 'dark' ? 'bg-white text-black hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-2xl'} px-10 py-5 rounded-[24px] font-black text-xs tracking-[0.2em] uppercase transition-all active:scale-95`}>
                    Begin Synthesis
                  </button>
               </div>
            )}
          </>
        )}

        {view === 'history' && (
          <div className="max-w-6xl w-full space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between px-4">
              <h1 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Archive</h1>
              <button 
                onClick={() => setFilterFavorites(!filterFavorites)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterFavorites ? 'bg-rose-500 text-white shadow-lg' : (theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-white border text-slate-400')}`}
              >
                {filterFavorites ? 'Favorites' : 'All Lessons'}
              </button>
            </div>

            {Object.keys(groupedHistory).length === 0 ? (
              <div className="text-center py-32 opacity-20">
                <p className="font-black uppercase tracking-[0.4em] text-[10px]">{filterFavorites ? 'No Bookmarks' : 'Archive Empty'}</p>
              </div>
            ) : (
              Object.entries(groupedHistory).map(([catId, lessons]) => {
                const interest = AVAILABLE_INTERESTS.find(i => i.id === catId);
                return (
                  <div key={catId} className="space-y-6">
                    <div className="flex items-center gap-4 px-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${interest?.color.split(' ')[0] || 'bg-indigo-500'} shadow-sm`}>
                        {interest?.icon || '📖'}
                      </div>
                      <h2 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{interest?.name || catId}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(lessons as Lesson[]).map(l => (
                        <div key={l.id} className={`p-8 rounded-[32px] border transition-all cursor-pointer group relative ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-50 hover:border-slate-200 shadow-sm'}`} onClick={() => { setCurrentLesson(l); setView('lesson'); }}>
                          {l.isFavorite && <div className="absolute top-6 right-6 text-rose-500">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3c1.54 0 2.946.654 3.937 1.706C12.614 3.654 14.02 3 15.563 3 18.536 3 21 5.322 21 8.25c0 3.924-2.438 7.11-4.73 9.272a25.115 25.115 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                            </svg>
                          </div>}
                          <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>{l.date}</span>
                          <h3 className={`font-black mt-3 text-lg group-hover:text-indigo-500 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{l.title}</h3>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 px-6 pointer-events-none">
        <nav className={`pointer-events-auto flex items-center gap-1 p-1 rounded-[28px] border backdrop-blur-3xl ${theme === 'dark' ? 'bg-black/40 border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : 'bg-white/70 border-slate-200 shadow-[0_15px_30px_rgba(0,0,0,0.1)]'}`}>
          <button onClick={() => setView('lesson')} className={navItemClass(view === 'lesson')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
            <span className="text-[9px] font-black tracking-[0.15em] uppercase">Daily</span>
          </button>
          <button onClick={() => setView('history')} className={navItemClass(view === 'history')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-[9px] font-black tracking-[0.15em] uppercase">Archive</span>
          </button>
          <button onClick={() => setView('onboarding')} className={navItemClass(view === 'onboarding')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12H13.5" />
            </svg>
            <span className="text-[9px] font-black tracking-[0.15em] uppercase">Scope</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;
