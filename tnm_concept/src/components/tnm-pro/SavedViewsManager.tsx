import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  BookmarkPlus, 
  Bookmark, 
  Share, 
  MoreVertical, 
  Trash2, 
  Edit,
  Copy,
  Check
} from 'lucide-react';

export interface SavedView {
  id: string;
  name: string;
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    symbols: string[];
    tags: string[];
    session: string | null;
    result: string | null;
  };
  createdAt: string;
  isDefault?: boolean;
}

interface SavedViewsManagerProps {
  currentFilters: SavedView['filters'];
  savedViews: SavedView[];
  onSaveView: (name: string, filters: SavedView['filters']) => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (viewId: string) => void;
  onUpdateView: (viewId: string, name: string) => void;
}

export const SavedViewsManager = ({
  currentFilters,
  savedViews,
  onSaveView,
  onLoadView,
  onDeleteView,
  onUpdateView
}: SavedViewsManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [copiedViewId, setCopiedViewId] = useState<string | null>(null);

  const hasActiveFilters = useMemo(() => {
    return (
      currentFilters.dateRange.from !== null ||
      currentFilters.dateRange.to !== null ||
      currentFilters.symbols.length > 0 ||
      currentFilters.tags.length > 0 ||
      currentFilters.session !== null ||
      currentFilters.result !== null
    );
  }, [currentFilters]);

  const handleSaveView = () => {
    if (viewName.trim()) {
      onSaveView(viewName.trim(), currentFilters);
      setViewName('');
      setIsDialogOpen(false);
    }
  };

  const handleEditView = (viewId: string, currentName: string) => {
    setEditingViewId(viewId);
    setEditingName(currentName);
  };

  const handleUpdateView = () => {
    if (editingViewId && editingName.trim()) {
      onUpdateView(editingViewId, editingName.trim());
      setEditingViewId(null);
      setEditingName('');
    }
  };

  const handleShareView = async (view: SavedView) => {
    // Create a shareable URL with encoded filters
    const encodedFilters = encodeURIComponent(JSON.stringify(view.filters));
    const shareUrl = `${window.location.origin}${window.location.pathname}#view=${encodedFilters}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedViewId(view.id);
      setTimeout(() => setCopiedViewId(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const getFilterSummary = (filters: SavedView['filters']) => {
    const summary = [];
    
    if (filters.dateRange.from || filters.dateRange.to) {
      summary.push('Date Range');
    }
    if (filters.symbols.length > 0) {
      summary.push(`${filters.symbols.length} Symbol${filters.symbols.length > 1 ? 's' : ''}`);
    }
    if (filters.tags.length > 0) {
      summary.push(`${filters.tags.length} Tag${filters.tags.length > 1 ? 's' : ''}`);
    }
    if (filters.session) {
      summary.push(`${filters.session} Session`);
    }
    if (filters.result) {
      summary.push(`${filters.result} Trades`);
    }
    
    return summary.length > 0 ? summary.join(', ') : 'No filters';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Saved Views
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={!hasActiveFilters}
                className="flex items-center gap-1"
              >
                <BookmarkPlus className="h-4 w-4" />
                Save Current View
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Current View</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">View Name</label>
                  <Input
                    placeholder="e.g., NAS100 London Session"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveView()}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium mb-1">Current Filters:</div>
                  <div>{getFilterSummary(currentFilters)}</div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveView} disabled={!viewName.trim()}>
                    Save View
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {savedViews.length > 0 ? (
          <div className="space-y-3">
            {savedViews.map((view) => (
              <div
                key={view.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 transition-colors"
              >
                <div className="flex-1 cursor-pointer" onClick={() => onLoadView(view)}>
                  <div className="flex items-center gap-2 mb-1">
                    {editingViewId === view.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateView();
                            if (e.key === 'Escape') {
                              setEditingViewId(null);
                              setEditingName('');
                            }
                          }}
                          className="h-8"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleUpdateView}>
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium">{view.name}</div>
                        {view.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getFilterSummary(view.filters)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Saved {new Date(view.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onLoadView(view)}>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Load View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditView(view.id, view.name)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareView(view)}>
                      {copiedViewId === view.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDeleteView(view.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Bookmark className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <div>No saved views</div>
            <div className="text-sm">Apply some filters and save your first view</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};