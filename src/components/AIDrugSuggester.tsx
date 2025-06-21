"use client";

import React, { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { suggestRelatedDrugs, type SuggestRelatedDrugsInput, type SuggestRelatedDrugsOutput } from "@/ai/flows/suggest-related-drugs";
import { Lightbulb, Loader2 } from "lucide-react";

const SuggestionFormSchema = z.object({
  activeIngredient: z.string().min(1, "Tên hoạt chất không được để trống"),
  concentration: z.string().min(1, "Nồng độ không được để trống"),
});

type SuggestionFormValues = z.infer<typeof SuggestionFormSchema>;

interface AIDrugSuggesterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AIDrugSuggester: React.FC<AIDrugSuggesterProps> = ({ open, onOpenChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestRelatedDrugsOutput | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuggestionFormValues>({
    resolver: zodResolver(SuggestionFormSchema),
  });

  const onSubmit: SubmitHandler<SuggestionFormValues> = async (data) => {
    setIsLoading(true);
    setSuggestions(null);
    try {
      const result = await suggestRelatedDrugs(data as SuggestRelatedDrugsInput);
      setSuggestions(result);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      toast({
        title: "Lỗi",
        description: "Không thể nhận gợi ý từ AI. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    reset();
    setSuggestions(null);
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center">
            <Lightbulb className="mr-2 h-6 w-6 text-primary" />
            Gợi ý thuốc AI
          </DialogTitle>
          <DialogDescription className="text-sm">
            Nhập hoạt chất và nồng độ để nhận gợi ý các thuốc tương tự từ AI.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-2">
          <div>
            <Label htmlFor="activeIngredient" className="block text-sm font-medium mb-1">
              Tên hoạt chất
            </Label>
            <Input
              id="activeIngredient"
              {...register("activeIngredient")}
              className="w-full"
              aria-invalid={errors.activeIngredient ? "true" : "false"}
            />
            {errors.activeIngredient && (
              <p className="mt-1 text-sm text-destructive">{errors.activeIngredient.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="concentration" className="block text-sm font-medium mb-1">
              Nồng độ
            </Label>
            <Input
              id="concentration"
              {...register("concentration")}
              className="w-full"
              aria-invalid={errors.concentration ? "true" : "false"}
            />
            {errors.concentration && (
              <p className="mt-1 text-sm text-destructive">{errors.concentration.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Nhận gợi ý"
            )}
          </Button>
        </form>

        {suggestions && (
          <div className="mt-6 p-2 space-y-4">
            <h3 className="text-lg font-semibold text-primary font-headline">Kết quả gợi ý:</h3>
            <div>
              <h4 className="font-medium mb-1">Các thuốc liên quan:</h4>
              {suggestions.relatedDrugs.length > 0 ? (
                <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
                  {suggestions.relatedDrugs.map((drug, index) => (
                    <li key={index}>{drug}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Không có thuốc liên quan nào được tìm thấy.</p>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-1">Lý do gợi ý:</h4>
              <ScrollArea className="h-32 w-full rounded-md border p-3 text-sm bg-muted/50">
                <p className="whitespace-pre-wrap">{suggestions.reasoning}</p>
              </ScrollArea>
            </div>
          </div>
        )}
        <DialogFooter className="mt-4 p-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>
              Đóng
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIDrugSuggester;
