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
  const navigate = useNavigate();

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

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
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

      <Button type="submit" disabled={submitting || rating === 0} className="w-full">
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
};
