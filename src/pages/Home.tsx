import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Cookie, Clock, Award } from "lucide-react";
import heroImage from "@/assets/hero-bakery.jpg";
import carouselCake from "@/assets/carousel-cake.jpg";
import carouselPastries from "@/assets/carousel-pastries.jpg";
import carouselPizza from "@/assets/carousel-pizza.jpg";
import carouselCookies from "@/assets/carousel-cookies.jpg";
import carouselBreads from "@/assets/carousel-breads.jpg";
import { Footer } from "@/components/Footer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

useEffect(() => {
  async function testConnection() {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.error("❌ Supabase NOT connected", error);
    } else {
      console.log("✅ Supabase connected successfully!", data);
    }
  }

  testConnection();
}, []);

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[600px] mt-16 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent" />
        </div>
        
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Freshly Baked
              <span className="block text-primary">Every Morning</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Experience the warmth of artisan baking with our handcrafted breads, pastries, and desserts made with love and the finest ingredients.
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild className="text-lg px-8">
                <Link to="/menu">View Menu</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link to="/auth">Order Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
            Our Specialties
          </h2>
          <Carousel 
            className="w-full max-w-6xl mx-auto"
            plugins={[
              Autoplay({
                delay: 3000,
              }),
            ]}
            opts={{
              loop: true,
            }}
          >
            <CarouselContent>
              <CarouselItem>
                <div className="relative h-[400px] rounded-xl overflow-hidden">
                  <img 
                    src={carouselCake} 
                    alt="Custom Cakes" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
                    <div className="p-8">
                      <h3 className="text-3xl font-bold text-foreground mb-2">Custom Cakes</h3>
                      <p className="text-lg text-muted-foreground">
                        Handcrafted celebration cakes for every occasion
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="relative h-[400px] rounded-xl overflow-hidden">
                  <img 
                    src={carouselPastries} 
                    alt="Fresh Pastries" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
                    <div className="p-8">
                      <h3 className="text-3xl font-bold text-foreground mb-2">Fresh Pastries</h3>
                      <p className="text-lg text-muted-foreground">
                        Buttery, flaky pastries baked fresh daily
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="relative h-[400px] rounded-xl overflow-hidden">
                  <img 
                    src={carouselPizza} 
                    alt="Artisan Pizza" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
                    <div className="p-8">
                      <h3 className="text-3xl font-bold text-foreground mb-2">Artisan Pizza</h3>
                      <p className="text-lg text-muted-foreground">
                        Wood-fired pizzas with premium toppings
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="relative h-[400px] rounded-xl overflow-hidden">
                  <img 
                    src={carouselCookies} 
                    alt="Gourmet Cookies" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
                    <div className="p-8">
                      <h3 className="text-3xl font-bold text-foreground mb-2">Gourmet Cookies</h3>
                      <p className="text-lg text-muted-foreground">
                        Crispy, chewy cookies in delightful flavors
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="relative h-[400px] rounded-xl overflow-hidden">
                  <img 
                    src={carouselBreads} 
                    alt="Fresh Breads" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
                    <div className="p-8">
                      <h3 className="text-3xl font-bold text-foreground mb-2">Fresh Breads</h3>
                      <p className="text-lg text-muted-foreground">
                        Traditional and specialty breads baked daily
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-lg bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cookie className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Fresh Ingredients</h3>
              <p className="text-muted-foreground">
                We use only the finest, locally-sourced ingredients to ensure the best quality in every bite.
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Baked Daily</h3>
              <p className="text-muted-foreground">
                Every product is freshly baked each morning, ensuring you always get the freshest treats.
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-card border border-border hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Artisan Quality</h3>
              <p className="text-muted-foreground">
                Traditional techniques combined with modern innovation for exceptional bakery products.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">Ready to Order?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse our extensive menu of breads, cookies, cakes, pizzas, and more. Place your order today!
          </p>
          <Button size="lg" asChild className="text-lg px-12">
            <Link to="/menu">Explore Menu</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
