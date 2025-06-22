import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Loader2 } from 'lucide-react';

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExporting: boolean;
  selectedCount: number;
  exportedCount?: number;
  fileName?: string;
}

const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  onClose,
  isExporting,
  selectedCount,
  exportedCount = 0,
  fileName
}) => {
  const progress = selectedCount > 0 ? (exportedCount / selectedCount) * 100 : 0;
  const isComplete = !isExporting && exportedCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                Đang xuất Excel...
              </>
            ) : isComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Xuất Excel thành công
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Chuẩn bị xuất Excel
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isExporting ? (
              `Đang xử lý ${selectedCount} dòng đã chọn...`
            ) : isComplete ? (
              `Đã xuất thành công ${exportedCount} dòng`
            ) : (
              `Sẵn sàng xuất ${selectedCount} dòng`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tiến độ:</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="outline">
                Đã chọn: {selectedCount}
              </Badge>
              {exportedCount > 0 && (
                <Badge variant="secondary">
                  Đã xuất: {exportedCount}
                </Badge>
              )}
            </div>
            
            {isComplete && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Hoàn thành
              </Badge>
            )}
          </div>

          {/* File info */}
          {fileName && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="text-sm text-green-700">
                <strong>File đã tạo:</strong> {fileName}
              </div>
              <div className="text-xs text-green-600 mt-1">
                File đã được tải về máy tính của bạn
              </div>
            </div>
          )}

          {/* Instructions */}
          {isComplete && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
              💡 <strong>Mẹo:</strong> Bạn có thể đóng cửa sổ này và tiếp tục làm việc. File Excel đã được lưu trong thư mục Downloads của máy tính.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportProgressModal; 