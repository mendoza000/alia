"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export function CopyLinkButton({
  text,
  label = "Copiar link",
  showLabel = false,
  variant = "ghost",
  size = "icon-sm",
  className,
}: {
  text: string;
  label?: string;
  showLabel?: boolean;
} & VariantProps<typeof buttonVariants> & { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={label}
      title={label}
      className={className}
    >
      {copied ? <Check className="text-emerald-600" /> : <Copy />}
      {showLabel && (copied ? "¡Copiado!" : label)}
    </Button>
  );
}
