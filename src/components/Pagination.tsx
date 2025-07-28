import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@utils/cn";

export interface Props {
  currentPage: number;
  totalPages: number;
  prevUrl: string;
  nextUrl: string;
}

export default function PaginationReact({
  currentPage,
  totalPages,
  prevUrl,
  nextUrl,
}: Props) {
  const prev = currentPage > 1;
  const next = currentPage < totalPages;

  return (
    <nav className="flex justify-center items-center space-x-4 mt-8 mb-4">
      {prev && (
        <Button variant="outline" asChild>
          <a href={prevUrl} className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </a>
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      {next && (
        <Button variant="outline" asChild>
          <a href={nextUrl} className="flex items-center gap-2">
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </a>
        </Button>
      )}
    </nav>
  );
}
