
import React, { useState, useEffect } from 'react';
import { Interest } from '../types';
import { AVAILABLE_INTERESTS } from '../constants';
import { getInterestSuggestions } from '../services/geminiService';

interface Props {
  selected: string[];
  customInterests: string[];
  onToggle: (id: string) => void;
  onAddCustom: (name: string) => void;
  onRemoveCustom: (name: string) => void;
  onConfirm: () => void;
}

const InterestSelector: React.FC<Props> = ({ selected, customInterests, onToggle, onAddCustom, onRemoveCustom, onConfirm }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const isLight = document.body.classList.contains('light-mode');

  useEffect(() => {
    if (selected.length > 0 || (customInterests && customInterests.length > 0)) {
      const timer = setTimeout(async () => {
        setLoadingSuggestions(true);
        try {
          const combined = [...selected, ...customInterests];
          const newsugs = await getInterestSuggestions(combined);
          setSuggestions(newsugs);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [selected, customInterests]);

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      onAddCustom(input.trim());
      setInput('');
    }
  };

  const textSecondaryClass = isLight ? 'text-slate-500' : 'text-white/40';
  const tagClass = isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-white/10 border-white/10 text-white';

  return (
    <div className="max-w-xl mx-auto p-6 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center space-y-4">
        <h1 className={`text-4xl font-extrabold tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Define Your<br/>Intellectual Scope
        </h1>
        <p className={`text-sm font-medium ${textSecondaryClass}`}>Select areas of mastery and reference materials.</p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleAdd} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add books or topics..."
            className={`w-full border p-5 pr-28 rounded-3xl transition-all text-lg font-medium focus:outline-none focus:ring-0 ${
              isLight 
                ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-indigo-500' 
                : 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/30'
            }`}
          />
          <button
            type="submit"
            className={`absolute right-2 top-2 bottom-2 px-6 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all ${
              isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            Add
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {selected.map(id => (
            <div key={id} className="bg-indigo-500 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg animate-in zoom-in-50">
              {AVAILABLE_INTERESTS.find(i => i.id === id)?.name || id}
              <button onClick={() => onToggle(id)} className="text-white/60 hover:text-white text-lg leading-none">×</button>
            </div>
          ))}
          {customInterests.map(name => (
            <div key={name} className={`${tagClass} border px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in zoom-in-50`}>
              📖 {name}
              <button onClick={() => onRemoveCustom(name)} className="opacity-40 hover:opacity-100 text-lg leading-none">×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-4 gap-3">
        {AVAILABLE_INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id);
          return (
            <button
              key={interest.id}
              onClick={() => onToggle(interest.id)}
              className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center gap-2 ${
                isSelected 
                ? 'border-indigo-500 bg-indigo-500/10 shadow-inner' 
                : (isLight ? 'border-slate-100 bg-white hover:border-slate-200' : 'border-white/5 bg-white/5 hover:border-white/10')
              }`}
            >
              <span className="text-2xl drop-shadow-md">{interest.icon}</span>
              <span className={`font-bold text-[10px] uppercase tracking-widest ${isSelected ? 'text-indigo-600' : textSecondaryClass}`}>
                {interest.name}
              </span>
            </button>
          );
        })}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3">
            <div className={`flex-1 h-px ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] ${isLight ? 'text-slate-300' : 'text-white/20'}`}>Synthesized Suggestions</h3>
            <div className={`flex-1 h-px ${isLight ? 'bg-slate-100' : 'bg-white/5'}`}></div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map(sug => (
              <button
                key={sug}
                onClick={() => onAddCustom(sug)}
                className={`border px-4 py-2 rounded-full text-[10px] font-bold transition-all uppercase tracking-widest ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                }`}
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={selected.length === 0 && customInterests.length === 0}
        className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-2xl ${
          (selected.length > 0 || customInterests.length > 0)
          ? (isLight ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-black hover:bg-white/90') 
          : (isLight ? 'bg-slate-100 text-slate-300 cursor-not-allowed border-slate-200' : 'bg-white/5 text-white/20 cursor-not-allowed border-white/5')
        }`}
      >
        Establish Connection
      </button>
    </div>
  );
};

export default InterestSelector;
