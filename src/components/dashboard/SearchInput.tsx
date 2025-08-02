
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchGlobal, SearchResult } from '@/services/searchService';
import SearchResults from './SearchResults';
import { useNavigate } from 'react-router-dom';

interface SearchInputProps {
  placeholder?: string;
  onSearch?: (term: string) => void;
  className?: string;
}

const SearchInput = ({ 
  placeholder = "Search meetings...", 
  onSearch,
  className = ""
}: SearchInputProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('[SearchInput] Performing search for:', query);
      const searchResponse = await searchGlobal(query, 7);
      setResults(searchResponse.results);
      setShowResults(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('[SearchInput] Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new debounce timer
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 250);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (searchTerm.trim()) {
          // Navigate to full search results page (future implementation)
          if (onSearch) {
            onSearch(searchTerm.trim());
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    console.log('[SearchInput] Result clicked:', result);
    
    // Navigate to meeting detail page
    navigate(`/app/meetings/${result.meetingId}`);
    
    // Close search results
    handleClose();
    
    // Optional: scroll to specific section based on match field
    // This could be implemented in the MeetingDetail component
  };

  // Handle closing search results
  const handleClose = () => {
    setShowResults(false);
    setSelectedIndex(-1);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      if (onSearch) {
        onSearch(searchTerm.trim());
      }
      handleClose();
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setShowResults(true)}
          className="sf-text pl-12 pr-4 py-3 w-full rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm hover:bg-card focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm"
          aria-expanded={showResults}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </form>
      
      <SearchResults
        results={results}
        isVisible={showResults}
        onResultClick={handleResultClick}
        onClose={handleClose}
        searchTerm={searchTerm}
        selectedIndex={selectedIndex}
      />
    </div>
  );
};

export default SearchInput;
