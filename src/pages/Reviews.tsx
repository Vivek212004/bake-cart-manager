import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { StarRating } from "@/components/reviews/StarRating";
import { format } from "date-fns";

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
    image_url: string | null;
  } | null;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("id, rating, review_text, photo_url, created_at, user_id, product_id")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map((r) => r.user_id);
        const productIds = data.map((r) => r.product_id);

        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, image_url")
          .in("id", productIds);

        const profilesMap = new Map(profilesData?.map((p) => [p.user_id, p]) || []);
        const productsMap = new Map(productsData?.map((p) => [p.id, p]) || []);

        const reviewsWithData = data.map((review: any) => ({
          ...review,
          profiles: profilesMap.get(review.user_id) || null,
          products: productsMap.get(review.product_id) || null,
        }));

        setReviews(reviewsWithData);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Customer Reviews</h1>
          <p className="text-muted-foreground mb-8">
            See what our customers are saying about our products
          </p>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </Card>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No reviews yet. Be the first to review a product!</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex gap-4">
                    {review.products?.image_url && (
                      <img
                        src={review.products.image_url}
                        alt={review.products.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{review.products?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {review.profiles?.full_name || "Anonymous User"} •{" "}
                            {format(new Date(review.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <StarRating rating={review.rating} size={16} />
                      </div>

                      {review.photo_url && (
                        <div className="my-3">
                          <img
                            src={review.photo_url}
                            alt="Review"
                            className="w-full max-w-md rounded-md object-cover"
                          />
                        </div>
                      )}

                      {review.review_text && (
                        <p className="text-sm text-foreground mt-2">{review.review_text}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
