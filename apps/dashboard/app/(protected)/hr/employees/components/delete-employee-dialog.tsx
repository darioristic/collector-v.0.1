"use client";

import { Loader2, Trash2 } from "lucide-react";

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

interface DeleteEmployeeDialogProps {
  open: boolean;
  employeeName: string | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteEmployeeDialog({
  open,
  employeeName,
  isLoading,
  onClose,
  onConfirm
}: DeleteEmployeeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-4" aria-hidden="true" />
            </span>
            Delete employee?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action permanently removes {employeeName ?? "the selected employee"} and all associated information.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Deleting...
              </>
            ) : (
              "Delete employee"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

