import { Mail, Phone, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-secondary/20 border-t border-border py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Useful Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Useful Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Store Locator
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Promo Codes
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Payment Methods</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-md p-2 flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground">Mastercard</span>
              </div>
              <div className="bg-card border border-border rounded-md p-2 flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground">GPay</span>
              </div>
              <div className="bg-card border border-border rounded-md p-2 flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground">Paytm</span>
              </div>
              <div className="bg-card border border-border rounded-md p-2 flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground">Visa</span>
              </div>
              <div className="bg-card border border-border rounded-md p-2 flex items-center justify-center">
                <span className="text-xs font-semibold text-foreground">UPI</span>
              </div>
            </div>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@theobroma.in"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  contact@theobroma.in
                </a>
              </li>
              <li>
                <a
                  href="tel:8182881881"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  8182881881
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border rounded-full p-3 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border rounded-full p-3 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Golden Crust Bakery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
