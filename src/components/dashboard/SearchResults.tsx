
import React from 'react';
import { SearchResult } from '@/services/searchService';
import { Card } from '@/components/ui/card';
import { FileText, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface SearchResultsProps {
  results: SearchResult[];
  isVisible: boolean;
  onResultClick: (result: SearchResult) => void;
  onClose: () => void;
  searchTerm: string;
  selectedIndex: number;
}

const SearchResults = ({ 
  results, 
  isVisible, 
  onResultClick, 
  onClose, 
  searchTerm,
  selectedIndex 
}: SearchResultsProps) => {
  if (!isVisible) return null;

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'meeting':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'transcript':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'action_item':
        return <CheckCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type'], matchField?: string) => {
    switch (type) {
      case 'meeting':
        return 'Meeting';
      case 'transcript':
        if (matchField === 'meeting_summary') return 'Found in Summary';
        if (matchField === 'key_items_and_action_items') return 'Found in Action Items';
        if (matchField === 'key_points_by_speaker') return 'Found in Speaker Notes';
        return 'Transcript';
      case 'action_item':
        return matchField === 'decisions' ? 'Decision' : 'Action Item';
      default:
        return 'Result';
    }
  };

  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-100 dark:bg-yellow-700 px-1 rounded">$1</mark>');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, h:mm a');
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Results dropdown */}
      <Card className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2C2C2C] shadow-md max-h-96 overflow-y-auto">
        <div role="listbox" className="py-2">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No results found for '{searchTerm}'</p>
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={result.id}
                role="option"
                aria-selected={index === selectedIndex}
                className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                  index === selectedIndex 
                    ? 'bg-blue-50 dark:bg-blue-950/20' 
                    : 'hover:bg-[#F3F4F6] dark:hover:bg-[#232323]'
                }`}
                onClick={() => onResultClick(result)}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(result.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="sf-display font-medium text-gray-900 dark:text-gray-100 text-sm truncate"
                          dangerouslySetInnerHTML={{ __html: highlightText(result.title) }}
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <span className="sf-text text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(result.date)}
                          </span>
                          <span className="sf-text text-xs text-gray-400 dark:text-gray-500">•</span>
                          <span className="sf-text text-xs text-gray-500 dark:text-gray-400">
                            {getTypeLabel(result.type, result.matchField)}
                          </span>
                        </div>
                        {result.snippet && (
                          <p 
                            className="sf-text text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: highlightText(result.snippet) }}
                          />
                        )}
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
};

export default SearchResults;
