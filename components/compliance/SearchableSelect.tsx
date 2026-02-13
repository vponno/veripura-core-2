import React, { useState, useRef, useEffect } from 'react';

interface SearchableSelectProps {
  options: string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  label: string;
  id: string;
  multiple?: boolean;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, label, id, multiple = false, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Normalize value to array for consistent internal handling
  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option: string) => {
    if (multiple) {
        const newValues = selectedValues.includes(option)
            ? selectedValues.filter(v => v !== option)
            : [...selectedValues, option];
        onChange(newValues);
        // Keep dropdown open for multiple selection
    } else {
        onChange(option);
        setIsOpen(false);
        setSearch('');
    }
  };

  const removeValue = (e: React.MouseEvent, val: string) => {
      e.stopPropagation();
      if (disabled) return;
      if (multiple) {
          onChange(selectedValues.filter(v => v !== val));
      } else {
          onChange('');
      }
  }

  const toggleOpen = () => {
      if (!disabled) {
          setIsOpen(!isOpen);
      }
  }

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      <label htmlFor={id} className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      
      <div className="relative">
        <div
          onClick={toggleOpen}
          className={`w-full text-left p-3 min-h-[52px] bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all flex flex-wrap gap-2 items-center pr-10 
            ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'cursor-pointer focus-within:ring-2 focus-within:ring-fuchsia-600 focus-within:border-fuchsia-600'}
            ${isOpen ? 'ring-2 ring-fuchsia-600 border-fuchsia-600' : ''}`}
        >
            {selectedValues.length > 0 ? (
                selectedValues.map(val => (
                    <span key={val} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-fuchsia-100 text-fuchsia-700 text-sm font-semibold animate-fade-in">
                        {val}
                        {!disabled && (
                             <button onClick={(e) => removeValue(e, val)} className="ml-1.5 text-fuchsia-500 hover:text-fuchsia-900 focus:outline-none rounded-full hover:bg-fuchsia-200 p-0.5 transition-colors">
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                             </button>
                        )}
                    </span>
                ))
            ) : (
                <span className="text-slate-400 font-medium ml-1">Select {multiple ? 'countries' : 'country'}...</span>
            )}

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-hidden flex flex-col animate-fade-in-up">
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <input
                type="text"
                placeholder="Search country..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-600 focus:border-transparent text-slate-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ul className="overflow-y-auto flex-1 p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                   const isSelected = selectedValues.includes(option);
                   return (
                    <li 
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={`px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors flex justify-between items-center ${isSelected ? 'bg-fuchsia-50 text-fuchsia-700 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                        {option}
                        {isSelected && <svg className="h-4 w-4 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    </li>
                   );
                })
              ) : (
                <li className="px-4 py-3 text-sm text-slate-400 text-center italic">
                  No countries found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};