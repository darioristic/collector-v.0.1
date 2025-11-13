"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface DeletePerformanceReviewDialogProps {
  open: boolean;
  reviewDate: string | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeletePerformanceReviewDialog({
  open,
  reviewDate,
  isLoading = false,
  onClose,
  onConfirm
}: DeletePerformanceReviewDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Performance Review</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the performance review from{" "}
            {reviewDate ? reviewDate : "this date"}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
