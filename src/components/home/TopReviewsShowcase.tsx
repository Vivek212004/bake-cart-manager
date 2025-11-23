import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/reviews/StarRating";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  photo_url: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
  products: {
    name: string;
  } | null;
}

export const TopReviewsShowcase = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopReviews();
  }, []);

  const fetchTopReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, rating, review_text, photo_url, created_at, user_id, product_id")
        .gte("rating", 4)
        .not("photo_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch profiles and products
        const userIds = data.map((r) => r.user_id);
        const productIds = data.map((r) => r.product_id);

        const [{ data: profilesData }, { data: productsData }] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
          supabase.from("products").select("id, name").in("id", productIds),
        ]);

        const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);
        const productsMap = new Map(productsData?.map((p) => [p.id, p]) || []);

        const reviewsWithData = data.map((review: any) => ({
          ...review,
          profiles: profilesMap.get(review.user_id) || null,
          products: productsMap.get(review.product_id) || null,
        }));

        setReviews(reviewsWithData);
      }
    } catch (error) {
      console.error("Error fetching top reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            What Our Customers Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4 text-foreground">
          What Our Customers Say
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-lg">
          Real reviews from our valued customers
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={review.photo_url!}
                  alt="Customer review"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <StarRating rating={review.rating} size={18} />
                  <span className="text-sm font-semibold text-primary">
                    {review.products?.name}
                  </span>
                </div>
                {review.review_text && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {review.review_text}
                  </p>
                )}
                <p className="text-xs font-medium text-foreground">
                  - {review.profiles?.full_name || "Anonymous"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" asChild>
            <Link to="/reviews">View All Reviews</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
