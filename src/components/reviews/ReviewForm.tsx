import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "./StarRating";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ReviewFormProps {
  productId: string;
  productName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewForm = ({ productId, productName, onReviewSubmitted }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo must be less than 5MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to leave a review");
        navigate("/auth");
        return;
      }

      // Check if user has purchased this product
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("order_items")
        .select("id, order_id")
        .eq("product_id", productId)
        .limit(1);

      if (purchaseError) {
        console.error("Error checking purchase:", purchaseError);
        toast.error("Failed to verify purchase");
        return;
      }

      if (!purchaseData || purchaseData.length === 0) {
        toast.error("You can only review products you have purchased");
        return;
      }

      // Verify the order belongs to the user
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id")
        .eq("id", purchaseData[0].order_id)
        .eq("user_id", user.id)
        .single();

      if (orderError || !orderData) {
        toast.error("You can only review products you have purchased");
        return;
      }

      let photoUrl = null;

      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('review-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrl;
      }

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
        photo_url: photoUrl,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You have already reviewed this product");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Review submitted successfully!");
      setRating(0);
      setReviewText("");
      setPhotoFile(null);
      setPhotoPreview(null);
      onReviewSubmitted?.();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-semibold">Rate {productName}</Label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          size={32}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-text">Your Review (Optional)</Label>
        <Textarea
          id="review-text"
          placeholder="Share your experience with this product..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {reviewText.length}/1000 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">Add Photo (Optional)</Label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {photoPreview && (
          <div className="relative w-32 h-32 mt-2">
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0"
              onClick={() => {
                setPhotoFile(null);
                setPhotoPreview(null);
              }}
            >
              ✕
            </Button>
          </div>
        )}
      </div>

      <Button type="submit" disabled={submitting || rating === 0} className="w-full">
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
};
