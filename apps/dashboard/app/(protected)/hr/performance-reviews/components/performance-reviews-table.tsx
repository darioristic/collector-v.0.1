"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { PerformanceReview } from "../types";

interface PerformanceReviewsTableProps {
  reviews: PerformanceReview[];
  isLoading: boolean;
  onEdit: (review: PerformanceReview) => void;
  onDelete: (review: PerformanceReview) => void;
}

const getRatingColor = (rating: number | null) => {
  if (!rating) return "secondary";
  if (rating >= 4) return "default";
  if (rating >= 3) return "secondary";
  return "destructive";
};

export default function PerformanceReviewsTable({
  reviews,
  onEdit,
  onDelete
}: PerformanceReviewsTableProps) {
  return (
    <div className="space-y-4">
      <div className="bg-card hidden overflow-hidden rounded-xl border shadow-sm lg:block">
        <Table>
          <TableHeader className="bg-card/95 sticky top-0 z-10 backdrop-blur">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Review Date</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{review.employeeName ?? "Unknown"}</span>
                  </div>
                </TableCell>
                <TableCell>{new Date(review.reviewDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{new Date(review.periodStart).toLocaleDateString()}</span>
                    <span className="text-muted-foreground">to</span>
                    <span>{new Date(review.periodEnd).toLocaleDateString()}</span>
                  </div>
                </TableCell>
                <TableCell>{review.reviewerName ?? "—"}</TableCell>
                <TableCell>
                  {review.rating ? (
                    <Badge variant={getRatingColor(review.rating)} size="xs">
                      {review.rating}/5
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(review)}
                      aria-label="Edit review">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(review)}
                      aria-label="Delete review">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="border-muted-foreground/20 bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-medium">{review.employeeName ?? "Unknown"}</span>
                <span className="text-muted-foreground text-sm">
                  {new Date(review.reviewDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(review)}
                  aria-label="Edit review">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(review)}
                  aria-label="Delete review">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Period</span>
                <span className="text-sm">
                  {new Date(review.periodStart).toLocaleDateString()} -{" "}
                  {new Date(review.periodEnd).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Reviewer</span>
                <span className="text-sm">{review.reviewerName ?? "—"}</span>
              </div>
              {review.rating && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Rating</span>
                  <Badge variant={getRatingColor(review.rating)} size="xs">
                    {review.rating}/5
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
