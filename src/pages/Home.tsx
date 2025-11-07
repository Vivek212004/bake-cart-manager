import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Cookie, Clock, Award } from "lucide-react";
import heroImage from "@/assets/hero-bakery.jpg";

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
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Golden Crust Bakery. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;