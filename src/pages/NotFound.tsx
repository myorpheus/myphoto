import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t("notFound.title")}</h1>
        <p className="mb-6 text-xl text-muted-foreground">{t("notFound.message")}</p>
        <Link to="/" className="text-primary underline hover:opacity-80">
          {t("notFound.returnHome")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
