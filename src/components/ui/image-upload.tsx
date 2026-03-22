"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCroppedImage } from "@/lib/crop-image";

interface ImageUploadProps {
  value: File | string | null;
  onChange: (file: File | null) => void;
  accept?: string;
}

export function ImageUpload({
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const previewUrl =
    value instanceof File ? URL.createObjectURL(value) : value;

  const pendingUrl = useMemo(() => {
    if (!pendingFile) return null;
    const url = URL.createObjectURL(pendingFile);
    return url;
  }, [pendingFile]);

  const handleClick = () => inputRef.current?.click();

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (file && accept.split(",").includes(file.type)) {
        setPendingFile(file);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setCropDialogOpen(true);
      }
    },
    [accept],
  );

  const handleCropConfirm = useCallback(async () => {
    if (!pendingFile || !croppedAreaPixels || !pendingUrl) return;
    const cropped = await getCroppedImage(
      pendingUrl,
      croppedAreaPixels,
      pendingFile.name,
      pendingFile.type,
    );
    onChange(cropped);
    setPendingFile(null);
    setCropDialogOpen(false);
  }, [pendingFile, croppedAreaPixels, pendingUrl, onChange]);

  const handleCropCancel = useCallback(() => {
    setPendingFile(null);
    setCropDialogOpen(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile],
  );

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  return (
    <div className="grid gap-1.5">
      {previewUrl ? (
        <div className="relative inline-flex items-center justify-center rounded-lg border-2 border-dashed border-border p-4">
          <Image
            src={previewUrl}
            alt="Preview"
            width={160}
            height={160}
            className="size-40 rounded-lg object-cover"
            unoptimized={value instanceof File}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-sm transition-colors ${
            dragOver
              ? "border-accent bg-accent/10"
              : "border-border bg-muted/30 hover:border-accent/50 hover:bg-muted/50"
          }`}
        >
          <ImagePlus className="size-8 text-muted-foreground" />
          <span className="text-muted-foreground">
            Arrastra una imagen o haz clic para seleccionar
          </span>
          <span className="text-xs text-muted-foreground/70">
            JPG, PNG o WebP — máx. 5 MB
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Recortar imagen</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            {pendingUrl && (
              <Cropper
                image={pendingUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-muted-foreground shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCropCancel}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCropConfirm}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
