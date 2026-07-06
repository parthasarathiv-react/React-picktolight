import React from 'react';
import { Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from 'components/ui/dialog';
import { Button } from 'components/ui/button';

/**
 * Reusable destructive confirmation dialog.
 *
 * Props:
 *  open         – boolean controlling open state
 *  onOpenChange – called with false when the dialog requests close
 *  title        – dialog heading
 *  description  – body text
 *  confirmLabel – label for the confirm button (default: "Delete")
 *  onConfirm    – called when the user clicks confirm
 */
export default function ConfirmDialog({
    open,
    onOpenChange,
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmLabel = 'Delete',
    onConfirm,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Override DialogContent width/padding for a tighter modal */}
            <DialogContent className="max-w-[420px] p-0 overflow-hidden border-0 shadow-2xl bg-transparent">
                <div
                    style={{
                        background: 'linear-gradient(145deg, #0a1a35 0%, #061228 100%)',
                        border: '1px solid rgba(139,175,229,0.18)',
                        borderRadius: '1rem',
                        boxShadow:
                            '0 0 0 1px rgba(95,166,255,0.08) inset, 0 32px 64px rgba(0,0,0,0.6)',
                    }}
                >
                    {/* ── Top accent bar ── */}
                    <div
                        style={{
                            height: '3px',
                            background:
                                'linear-gradient(90deg, transparent 0%, #ef4444 40%, #f97316 100%)',
                            borderRadius: '1rem 1rem 0 0',
                        }}
                    />

                    {/* ── Body ── */}
                    <div className="flex flex-col items-center text-center px-8 pt-8 pb-6 gap-5">
                        {/* Animated icon ring */}
                        <div className="relative flex items-center justify-center">
                            {/* Outer pulse ring */}
                            <span
                                className="absolute w-20 h-20 rounded-full animate-ping"
                                style={{
                                    background: 'rgba(239,68,68,0.08)',
                                    animationDuration: '2s',
                                }}
                            />
                            {/* Mid ring */}
                            <span
                                className="absolute w-16 h-16 rounded-full"
                                style={{
                                    background: 'rgba(239,68,68,0.06)',
                                    border: '1px solid rgba(239,68,68,0.15)',
                                }}
                            />
                            {/* Icon container */}
                            <span
                                className="relative flex items-center justify-center w-14 h-14 rounded-full"
                                style={{
                                    background:
                                        'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.08) 100%)',
                                    border: '1.5px solid rgba(239,68,68,0.35)',
                                    boxShadow: '0 0 20px rgba(239,68,68,0.2)',
                                }}
                            >
                                <Trash2 className="w-6 h-6 text-red-400" />
                            </span>
                        </div>

                        {/* Text */}
                        <div className="space-y-2">
                            <DialogTitle
                                style={{
                                    fontSize: '1.15rem',
                                    fontWeight: 700,
                                    color: '#f1f5f9',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {title}
                            </DialogTitle>
                            <DialogDescription
                                style={{
                                    fontSize: '0.875rem',
                                    color: '#7fa8d4',
                                    lineHeight: 1.6,
                                    maxWidth: '280px',
                                    margin: '0 auto',
                                }}
                            >
                                {description}
                            </DialogDescription>
                        </div>

                        {/* Divider */}
                        <div
                            style={{
                                width: '100%',
                                height: '1px',
                                background:
                                    'linear-gradient(90deg, transparent, rgba(139,175,229,0.15), transparent)',
                            }}
                        />

                        {/* Buttons */}
                        <div className="flex gap-3 w-full">
                            <Button
                                variant="outline"
                                className="flex-1 h-10 font-semibold text-sm tracking-wide"
                                style={{
                                    background: 'rgba(139,175,229,0.06)',
                                    border: '1px solid rgba(139,175,229,0.2)',
                                    color: '#a7bedf',
                                    borderRadius: '0.6rem',
                                }}
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-10 font-semibold text-sm tracking-wide border-0 gap-2"
                                style={{
                                    background:
                                        'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                    color: '#fff',
                                    borderRadius: '0.6rem',
                                    boxShadow: '0 4px 14px rgba(220,38,38,0.35)',
                                }}
                                onClick={() => {
                                    onConfirm?.();
                                    onOpenChange(false);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                                {confirmLabel}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
