import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadReports, isMock } from "@/lib/api";

export function UploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: uploadReports,
    onSuccess: (result) => {
      if (isMock) {
        toast.warning("Modalità demo: VITE_API_BASE_URL non impostato, riavvia il dev server dopo aver configurato .env.local");
        return;
      }
      toast.success(`${result.inserted} analisi salvate nel database`);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err: Error) => {
      toast.error(`Errore upload: ${err.message}`);
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        // Supporta sia array diretto che wrapper { results: [...] }
        const data = Array.isArray(json) ? json : (json?.results ?? json);
        mutate(data);
      } catch {
        toast.error("File JSON non valido");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile}/>
      <Button className="bg-blue-700" variant="outline" size="sm" disabled={isPending} onClick={() => fileInputRef.current?.click()}>
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Upload className="size-3.5" />
        )}
        Carica analisi
      </Button>
    </>
  );
}
