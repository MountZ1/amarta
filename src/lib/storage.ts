import { supabaseAdmin } from "./supabase";

export const BUCKET_NAME = "products";

export async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
      });
    }
  } catch (error) {
    console.error("Failed to ensure bucket exists:", error);
  }
}

export async function uploadProductImage(
  file: File | Blob,
  fileName: string
): Promise<{ url: string; error?: string }> {
  // Validate file size (max 2MB)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { url: "", error: "Ukuran gambar maksimal 2MB" };
  }

  // Validate format
  const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (file.type && !validTypes.includes(file.type)) {
    return { url: "", error: "Format gambar harus JPEG atau PNG" };
  }

  await ensureBucketExists();

  const ext = fileName.split(".").pop() || "jpg";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(uniqueName, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    return { url: "", error: uploadError.message };
  }

  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(uniqueName);

  return { url: data.publicUrl };
}
