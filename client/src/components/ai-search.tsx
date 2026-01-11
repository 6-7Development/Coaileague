import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Building2, 
  Calendar, 
  FileText, 
  Clock, 
  Search,
  Sparkles,
  ArrowRight,
  User,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'employee' | 'client' | 'schedule' | 'invoice' | 'timeEntry';
  title: string;
  subtitle: string;
  description?: string;
  relevanceScore: number;
  data: Record<string, any>;
  actions?: { label: string; action: string; path?: string }[];
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  aiSummary?: string;
  totalCount: number;
  categories: {
    employees: number;
    clients: number;
    schedules: number;
    invoices: number;
    timeEntries: number;
  };
}

interface AISearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const typeIcons: Record<string, typeof Users> = {
  employee: User,
  client: Building2,
  schedule: Calendar,
  invoice: FileText,
  timeEntry: Clock,
};

const typeLabels: Record<string, string> = {
  employee: 'Employee',
  client: 'Client',
  schedule: 'Schedule',
  invoice: 'Invoice',
  timeEntry: 'Time Entry',
};

const typePaths: Record<string, string> = {
  employee: '/employees',
  client: '/clients',
  schedule: '/schedule',
  invoice: '/invoices',
  timeEntry: '/time-tracking',
};

export function AISearch({ open: controlledOpen, onOpenChange }: AISearchProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const { data: searchData, isLoading, isFetching } = useQuery<{ success: boolean; data: SearchResponse }>({
    queryKey: ['/api/search', debouncedQuery],
    enabled: debouncedQuery.length >= 2,
  });

  const { data: suggestionsData } = useQuery<{ success: boolean; data: { suggestions: string[] } }>({
    queryKey: ['/api/search/suggestions', debouncedQuery],
    enabled: debouncedQuery.length >= 1 && debouncedQuery.length < 2,
  });

  const handleSelect = useCallback((result: SearchResult) => {
    const primaryAction = result.actions?.[0];
    if (primaryAction?.path) {
      setLocation(primaryAction.path);
    } else {
      setLocation(`${typePaths[result.type]}/${result.id}`);
    }
    setOpen(false);
    setQuery("");
  }, [setLocation, setOpen]);

  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  }, []);

  const results = searchData?.data?.results || [];
  const aiSummary = searchData?.data?.aiSummary;
  const categories = searchData?.data?.categories;
  const suggestions = suggestionsData?.data?.suggestions || [];

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-md">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            ref={inputRef}
            placeholder="Search employees, clients, invoices, schedules..."
            value={query}
            onValueChange={setQuery}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="input-ai-search"
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        <CommandList className="max-h-[400px] overflow-y-auto">
          {(isLoading || isFetching) && debouncedQuery.length >= 2 && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">Searching with AI...</span>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !isFetching && debouncedQuery.length >= 2 && results.length === 0 && (
            <CommandEmpty className="py-6 text-center text-sm">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p>No results found for "{debouncedQuery}"</p>
              <p className="text-muted-foreground mt-1">Try a different search term</p>
            </CommandEmpty>
          )}

          {debouncedQuery.length < 2 && suggestions.length > 0 && (
            <CommandGroup heading="Suggestions">
              {suggestions.map((suggestion, index) => (
                <CommandItem
                  key={`suggestion-${index}`}
                  onSelect={() => handleSuggestionSelect(suggestion)}
                  className="flex items-center gap-2 cursor-pointer"
                  data-testid={`suggestion-${index}`}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>{suggestion}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {debouncedQuery.length < 2 && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto h-8 w-8 mb-2 text-cyan-500/50" />
              <p>Start typing to search across your workspace</p>
              <p className="text-xs mt-1">Search employees, clients, schedules, invoices, and more</p>
            </div>
          )}

          {aiSummary && (
            <>
              <div className="px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">{aiSummary}</p>
                </div>
              </div>
              <CommandSeparator />
            </>
          )}

          {categories && results.length > 0 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b">
              {Object.entries(categories).map(([key, count]) => {
                if (count === 0) return null;
                const Icon = typeIcons[key === 'schedules' ? 'schedule' : key === 'timeEntries' ? 'timeEntry' : key.slice(0, -1)];
                return (
                  <Badge 
                    key={key} 
                    variant="secondary" 
                    className="text-xs font-normal gap-1"
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {key}: {count}
                  </Badge>
                );
              })}
            </div>
          )}

          {Object.entries(groupedResults).map(([type, items]) => (
            <CommandGroup 
              key={type} 
              heading={
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = typeIcons[type];
                    return Icon ? <Icon className="h-4 w-4" /> : null;
                  })()}
                  <span>{typeLabels[type]}s</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {items.length}
                  </Badge>
                </div>
              }
            >
              {items.map((result) => {
                const Icon = typeIcons[result.type];
                return (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 p-2 cursor-pointer group"
                    data-testid={`search-result-${result.type}-${result.id}`}
                  >
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md border",
                      "bg-background group-hover:bg-accent transition-colors"
                    )}>
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{result.title}</span>
                        {result.relevanceScore > 0.8 && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Best match
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{result.subtitle}</span>
                        {result.description && (
                          <>
                            <span>•</span>
                            <span className="truncate">{result.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}

          {results.length > 0 && (
            <>
              <CommandSeparator />
              <div className="p-2 text-center">
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Enter</kbd> to select
                  {" "}<kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">↑↓</kbd> to navigate
                  {" "}<kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Esc</kbd> to close
                </p>
              </div>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export function AISearchTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 h-10 px-3 rounded-md border bg-background",
          "text-sm text-muted-foreground hover:text-foreground hover:bg-accent",
          "transition-colors cursor-pointer"
        )}
        title="AI Search (⌘K)"
        data-testid="button-ai-search"
      >
        <Search className="h-5 w-5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <AISearch open={open} onOpenChange={setOpen} />
    </>
  );
}
