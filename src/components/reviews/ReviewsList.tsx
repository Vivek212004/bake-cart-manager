import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "./StarRating";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  photo_url: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

interface ReviewsListProps {
  productId: string;
}

export const ReviewsList = ({ productId }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, rating, review_text, photo_url, created_at, user_id")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map((r) => r.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);

        const reviewsWithProfiles = data.map((review: any) => ({
          ...review,
          profiles: profilesMap.get(review.user_id) || null,
        }));

        setReviews(reviewsWithProfiles);
      } else {
        setReviews([]);
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">
                  {review.profiles?.full_name || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </p>
              </div>
              <StarRating rating={review.rating} size={16} />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {review.photo_url && (
              <img 
                src={review.photo_url} 
                alt="Review" 
                className="w-full max-w-xs rounded-md object-cover"
              />
            )}
            {review.review_text && (
              <p className="text-sm text-foreground">{review.review_text}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
