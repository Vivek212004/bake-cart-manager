import { Button } from "@/components/ui/button";
import { Trash2, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BulkProductActionsProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkSetAvailable: (available: boolean) => void;
  onClearSelection: () => void;
}

export const BulkProductActions = ({
  selectedCount,
  onBulkDelete,
  onBulkSetAvailable,
  onClearSelection,
}: BulkProductActionsProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg mb-4">
      <span className="text-sm font-medium">
        {selectedCount} product{selectedCount > 1 ? "s" : ""} selected
      </span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={() => onBulkSetAvailable(true)}>
        <Eye className="h-4 w-4 mr-2" />
        Make Available
      </Button>
      <Button variant="outline" size="sm" onClick={() => onBulkSetAvailable(false)}>
        <EyeOff className="h-4 w-4 mr-2" />
        Make Unavailable
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} product{selectedCount > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Clear
      </Button>
    </div>
  );
};
