import type { Area } from "react-easy-crop";

const MAX_SIZE = 800;

export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
  mimeType: string,
): Promise<File> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");

  const size = Math.min(Math.max(pixelCrop.width, pixelCrop.height), MAX_SIZE);
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      mimeType,
      0.9,
    );
  });

  return new File([blob], fileName, { type: mimeType });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
