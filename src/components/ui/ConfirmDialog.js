import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from 'components/ui/dialog';
import { Button } from 'components/ui/button';
import { AlertTriangle, Info, HelpCircle, CheckCircle } from 'lucide-react';

export function ConfirmDialog({
    open,
    onOpenChange,
    title = "Confirm Action",
    description = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    variant = "destructive",
    isLoading = false
}) {
    const handleCancel = () => {
        if (onCancel) onCancel();
        if (onOpenChange) onOpenChange(false);
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
    };

    const renderIcon = () => {
        switch (variant) {
            case "destructive":
            case "warning":
                return <AlertTriangle className="w-6 h-6 text-red-500" />;
            case "info":
                return <Info className="w-6 h-6 text-blue-500" />;
            case "success":
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            default:
                return <HelpCircle className="w-6 h-6 text-yellow-500" />;
        }
    };

    const getIconBg = () => {
        switch (variant) {
            case "destructive":
            case "warning":
                return "bg-red-500/10 border-red-500/20";
            case "info":
                return "bg-blue-500/10 border-blue-500/20";
            case "success":
                return "bg-green-500/10 border-green-500/20";
            default:
                return "bg-yellow-500/10 border-yellow-500/20";
        }
    };

    const getConfirmButtonClasses = () => {
        switch (variant) {
            case "destructive":
                return "bg-red-600 hover:bg-red-700 text-white min-w-[100px] shadow-lg shadow-red-900/20";
            case "info":
                return "bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]";
            default:
                return "bg-ot-action hover:bg-ot-action-hover text-white min-w-[100px]";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-red-500/20 bg-gradient-to-b from-ot-surface-top/90 to-ot-bg-bottom/90 backdrop-blur-xl">
                <DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${getIconBg()}`}>
                            {renderIcon()}
                        </div>
                        <div className="space-y-2 text-center">
                            <DialogTitle className="text-xl text-white">{title}</DialogTitle>
                            {description && (
                                <DialogDescription className="text-muted-foreground text-sm">
                                    {description}
                                </DialogDescription>
                            )}
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter className="flex justify-center gap-3 sm:justify-center mt-2 border-t border-ot-border/50 pt-4">
                    <Button
                        variant="outline"
                        className="border-ot-border text-white hover:bg-ot-surface-elev-bottom min-w-[100px]"
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === "destructive" ? "destructive" : "default"}
                        className={getConfirmButtonClasses()}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Processing..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmDialog;
