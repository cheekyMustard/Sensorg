import { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { X } from 'lucide-react';
import { useBikeSuggest } from '../../hooks/useRequests.js';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Props:
 *   value    – string[] of bike labels (controlled)
 *   onChange – (labels: string[]) => void
 */
export default function BikeTagsInput({ value = [], onChange, shopId = null }) {
  const [input, setInput]       = useState('');
  const [showList, setShowList] = useState(false);
  const inputRef                = useRef(null);
  const containerRef            = useRef(null);

  const debouncedQuery = useDebounce(input, 300);
  const { data: suggestions = [] } = useBikeSuggest(debouncedQuery, shopId);

  function addLabel(label) {
    const trimmed = label.trim().toUpperCase();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput('');
    setShowList(false);
  }

  function removeLabel(label) {
    onChange(value.filter(l => l !== label));
  }

  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addLabel(input);
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowList(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = suggestions.filter(b => !value.includes(b.label));

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-1.5 rounded-lg border border-gray-300 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(label => (
          <span
            key={label}
            className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
          >
            {label}
            <button
              type="button"
              onClick={() => removeLabel(label)}
              className="text-blue-400 hover:text-blue-700"
              aria-label={`Remove ${label}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowList(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => input.trim() && setShowList(true)}
          onBlur={() => { if (input.trim()) flushSync(() => addLabel(input)); }}
          placeholder={value.length === 0 ? 'Type bike label…' : ''}
          className="min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {showList && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-md">
          {filtered.map(b => (
            <li key={b.id}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); addLabel(b.label); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {b.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
