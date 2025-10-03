import { Link } from "react-router-dom";
import { Camera } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Camera className="h-5 w-5 text-primary" />
              <span>Headshots AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Professional AI-generated headshots for your online presence.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Product</h3>
            <ul className="space-y-2">
              <li>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#examples" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Examples
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/astriaai/headshots-starter" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.astria.ai/docs/api/pack/pack/" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com/Astria_AI" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:support@astria.ai" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a 
                  href="https://choosealicense.com/licenses/mit/" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  License
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Headshots AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Open-source powered by{" "}
              <a
                href="https://www.astria.ai/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Astria
              </a>
              ,{" "}
              <a
                href="https://supabase.com/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase
              </a>
              , and Lovable
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
