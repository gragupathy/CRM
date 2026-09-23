"use client";

import { useRef, useState } from "react";
import { Building2, Paperclip } from "lucide-react";
import {
  LOGO_ACCEPT,
  LOGO_DISPLAY_SIZE,
  LOGO_MAX_BYTES,
  LOGO_OUTPUT_SIZE,
  isAllowedLogoFile,
} from "@/lib/company-logo";

function sharpenImageData(src: ImageData, amount = 0.85) {
  const { width: w, height: h, data } = src;
  const out = new ImageData(w, h);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = Math.min(w - 1, Math.max(0, x + kx));
          const py = Math.min(h - 1, Math.max(0, y + ky));
          const pi = (py * w + px) * 4;
          const kv = kernel[(ky + 1) * 3 + (kx + 1)];
          r += data[pi] * kv;
          g += data[pi + 1] * kv;
          b += data[pi + 2] * kv;
        }
      }
      out.data[i] = Math.min(255, Math.max(0, data[i] * (1 - amount) + r * amount));
      out.data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * (1 - amount) + g * amount));
      out.data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * (1 - amount) + b * amount));
      out.data[i + 3] = data[i + 3];
    }
  }
  return out;
}

async function cropAndSharpen(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = LOGO_OUTPUT_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process logo.");
  ctx.fillStyle = "#e8eef5";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const dw = bitmap.width * scale;
  const dh = bitmap.height * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (size - dw) / 2, (size - dh) / 2, dw, dh);
  ctx.putImageData(sharpenImageData(ctx.getImageData(0, 0, size, size)), 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process logo."))), "image/png");
  });
  return new File([blob], "logo.png", { type: "image/png" });
}

export function CompanyLogoField({
  hasLogo,
  logoSrc,
}: {
  hasLogo: boolean;
  logoSrc?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(hasLogo ? (logoSrc ?? "/api/company/logo") : null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    setError(null);
    if (!file || !inputRef.current) return;
    const invalid = isAllowedLogoFile(file);
    if (invalid) {
      setError(invalid);
      inputRef.current.value = "";
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setError("Logo must be 2 MB or less.");
      inputRef.current.value = "";
      return;
    }
    try {
      const processed = await cropAndSharpen(file);
      const dt = new DataTransfer();
      dt.items.add(processed);
      inputRef.current.files = dt.files;
      const url = URL.createObjectURL(processed);
      setPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
      setError("Could not crop this image. Try another JPG or PNG.");
      inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div
        className="flex items-center justify-center overflow-hidden rounded-2xl bg-[#e4edf5]"
        style={{ width: LOGO_DISPLAY_SIZE, height: LOGO_DISPLAY_SIZE }}
      >
        {preview ? (
          <img src={preview} alt="Company logo" className="h-full w-full object-cover" />
        ) : (
          <Building2 className="text-slate-300" size={52} strokeWidth={1.25} />
        )}
      </div>
      <div className="pt-1">
        <button
          type="button"
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-ink-800"
          title="Upload company logo (JPG or PNG, max 2 MB)"
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={inputRef}
          type="file"
          name="logo"
          accept={LOGO_ACCEPT}
          className="hidden"
          onChange={(e) => void onPick(e.target.files?.[0])}
        />
        <p className="mt-1 max-w-[9rem] text-[11px] leading-snug text-slate-400">JPG or PNG, max 2 MB</p>
        {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
