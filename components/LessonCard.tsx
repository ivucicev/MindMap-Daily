
import React from 'react';
import { Lesson } from '../types';
import { AVAILABLE_INTERESTS } from '../constants';

interface Props {
  lesson: Lesson;
  onNext: () => void;
  isLoading: boolean;
}

const LessonCard: React.FC<Props> = ({ lesson, onNext, isLoading }) => {
  const isLight = document.body.classList.contains('light-mode');
  const interest = AVAILABLE_INTERESTS.find(i => i.id === lesson.categoryRef) 
                || { icon: '💡', color: 'bg-indigo-600' };

  const patternSeed = lesson.title.length % 4;

  return (
    <div className="w-full max-w-[420px] mx-auto animate-in fade-in zoom-in-95 duration-700 px-4">
      <div className="card-glass rounded-[40px] overflow-hidden flex flex-col h-[650px] relative shadow-2xl group border-2 border-transparent hover:border-indigo-500/20 transition-all">
        
        <div className="absolute bottom-0 right-0 w-full h-1/2 opacity-20 pointer-events-none">
          {patternSeed === 0 && (
            <svg viewBox="0 0 200 200" className="w-full h-full text-indigo-500 fill-none stroke-current stroke-[0.5]">
              {Array.from({length: 15}).map((_, i) => (
                <path key={i} d={`M${200-i*10},200 Q${150-i*5},${150-i*10} ${100-i*15},0`} />
              ))}
            </svg>
          )}
          {patternSeed === 1 && (
             <svg viewBox="0 0 200 200" className="w-full h-full text-emerald-400 fill-none stroke-current stroke-[0.5]">
                {Array.from({length: 10}).map((_, i) => (
                  <circle key={i} cx="200" cy="200" r={i * 15} />
                ))}
             </svg>
          )}
          {patternSeed === 2 && (
             <svg viewBox="0 0 200 200" className="w-full h-full text-yellow-400 fill-none stroke-current stroke-[2]">
                {Array.from({length: 8}).map((_, i) => (
                  <line key={i} x1={200 - i*20} y1="200" x2="200" y2={200 - i*20} />
                ))}
             </svg>
          )}
          {patternSeed === 3 && (
             <svg viewBox="0 0 200 200" className="w-full h-full text-rose-500 fill-none stroke-current stroke-[1]">
                {Array.from({length: 12}).map((_, i) => (
                  <path key={i} d={`M 0 ${i*15} Q 100 ${100 + i*5} 200 ${i*15}`} />
                ))}
             </svg>
          )}
        </div>

        <div className="p-8 flex justify-between items-start z-10 shrink-0">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl ${interest.color?.split(' ')[0] || 'bg-indigo-600'}`}>
            <span className="drop-shadow-md">{interest.icon}</span>
          </div>
          <div className="text-right">
            <span className={`block text-[10px] font-black tracking-[0.2em] uppercase ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              Session Log • {lesson.date}
            </span>
            <span className="inline-block px-3 py-1 mt-2 rounded-full bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-wider border border-indigo-500/20">
              {lesson.category}
            </span>
          </div>
        </div>

        <div className="px-8 pb-4 flex-1 flex flex-col z-10 relative overflow-hidden">
          <div className="mb-6 shrink-0">
            <h2 className={`text-2xl font-black leading-tight mb-3 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {lesson.title}
            </h2>
            <div className="w-12 h-1.5 bg-indigo-500 rounded-full"></div>
          </div>

          <div className="flex-1 overflow-y-auto pr-3 space-y-8 custom-scrollbar">
             <section>
               <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Core Insight</h4>
               <p className={`text-sm leading-relaxed font-medium ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                 {lesson.content}
               </p>
             </section>

             <section className={`p-5 rounded-3xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
               <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Practical Protocol</h4>
               <p className={`text-sm font-semibold leading-relaxed ${isLight ? 'text-slate-800' : 'text-white/90'}`}>
                 {lesson.practicalApplication}
               </p>
             </section>
             
             {lesson.connectionToPrevious && lesson.connectionToPrevious !== "This is the first lesson." && (
               <section className="opacity-60 border-t border-dashed border-current/10 pt-4">
                 <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isLight ? 'text-slate-400' : 'text-white/30'}`}>Neural Link</h4>
                 <p className={`text-xs italic leading-relaxed font-medium ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                   {lesson.connectionToPrevious}
                 </p>
               </section>
             )}

             {lesson.sourceMaterial && (
               <div className="pt-2">
                 <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isLight ? 'text-slate-300' : 'text-white/20'}`}>Source Intelligence: </span>
                 <span className="text-indigo-500 text-[10px] font-black uppercase tracking-wider">{lesson.sourceMaterial}</span>
               </div>
             )}
          </div>
        </div>

        <div className="p-8 z-10 pt-4 shrink-0">
          <button
            onClick={onNext}
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-2xl ${
              isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'
            }`}
          >
            {isLoading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
            ) : (
              <>
                Advance Path
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonCard;
