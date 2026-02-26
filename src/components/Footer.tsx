import { Link } from "react-router-dom";
import { Camera } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Camera className="h-5 w-5 text-primary" />
              <span>{t("app.name")}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("footer.description")}
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t("footer.product")}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer.howItWorks")}
                </a>
              </li>
              <li>
                <a href="#examples" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer.examples")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer.pricing")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t pt-8">
          <p className="text-sm text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear().toString() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
