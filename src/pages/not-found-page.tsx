import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SearchX } from "lucide-react";
import { useT } from "@/hooks/use-t";

export default function NotFoundPage() {
  const t = useT();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <SearchX className="size-10 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-7xl font-bold tracking-tight tabular-nums text-foreground">404</h1>
          <p className="text-xl font-semibold text-foreground">{t.notFound.title}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t.notFound.description}</p>
        </div>
      </div>
      <Button onClick={() => navigate("/")} className="gap-2">
        <ArrowLeft className="size-4" />
        {t.notFound.back}
      </Button>
    </div>
  );
}
