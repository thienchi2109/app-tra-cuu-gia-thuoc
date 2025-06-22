import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckSquare, X, SquareCheckBig } from 'lucide-react';

interface SelectionModeToggleProps {
  selectionMode: 'view' | 'select';
  onToggle: () => void;
  selectionCount: number;
  hasSelections: boolean;
  onClearSelections: () => void;
}

const SelectionModeToggle: React.FC<SelectionModeToggleProps> = ({
  selectionMode,
  onToggle,
  selectionCount,
  hasSelections,
  onClearSelections,
}) => {
  return (
    <div className="flex items-center gap-3">
      {/* Mode Toggle Button */}
      <Button
        variant={selectionMode === 'select' ? 'default' : 'outline'}
        onClick={onToggle}
        className="gap-2"
        size="sm"
      >
        {selectionMode === 'view' ? (
          <>
            <CheckSquare className="h-4 w-4" />
            <span>Chọn dòng</span>
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            <span>Thoát chọn</span>
          </>
        )}
      </Button>

      {/* Selection Info */}
      {selectionMode === 'select' && (
        <div className="flex items-center gap-2">
          {hasSelections ? (
            <>
              <Badge variant="secondary" className="gap-1">
                <SquareCheckBig className="h-3 w-3" />
                {selectionCount} đã chọn
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelections}
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                title="Xóa tất cả lựa chọn"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Click checkbox để chọn dòng
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectionModeToggle; 