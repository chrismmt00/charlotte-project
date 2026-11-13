import "server-only";
import { randomUUID } from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import { fail, required } from "./http";

function r2() {
  if (
    !process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_BUCKET
  )
    fail(
      503,
      "storage_not_configured",
      "Private file storage has not been configured yet.",
    );
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}
export async function uploadPrivate(file, clientId, projectId) {
  if(process.env.PRIVATE_UPLOADS_ENABLED!=="true")fail(503,"uploads_disabled","Please send private project files to Klyvora by email.");
  if (
    !file ||
    typeof file === "string" ||
    file.size === 0 ||
    file.size > 50 * 1024 * 1024
  )
    fail(413, "too_large", "Choose a file between 1 byte and 50 MB.");
  const key = `clients/${clientId}/${randomUUID()}`;
  await r2().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: "application/octet-stream",
      ContentDisposition: "attachment",
    }),
  );
  return prisma.file.create({
    data: {
      clientId,
      projectId: projectId || null,
      key,
      name: file.name.slice(0, 200),
      type: file.type || "application/octet-stream",
      size: file.size,
    },
  });
}
export async function downloadPrivate(id, clientId) {
  const file = required(
    await prisma.file.findFirst({ where: { id, clientId } }),
    "File",
  );
  return getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: file.key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    }),
    { expiresIn: 300 },
  );
}
export async function uploadImage(file, clientId) {
  if (
    !file ||
    typeof file === "string" ||
    !file.size ||
    file.size > 25 * 1024 * 1024
  )
    fail(413, "too_large", "Choose an image under 25 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8,
    png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    webp =
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP";
  if (!jpeg && !png && !webp)
    fail(415, "image", "Only JPEG, PNG and WebP images are supported.");
  if (
    !process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_IMAGES_API_TOKEN
  )
    fail(503, "storage_not_configured", "Image uploads are not configured.");
  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], {
      type: jpeg ? "image/jpeg" : png ? "image/png" : "image/webp",
    }),
    file.name,
  );
  form.append("metadata", JSON.stringify({ clientId }));
  const result = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID}/images/v1`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
      },
      body: form,
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!result.ok)
    fail(
      502,
      "upload_failed",
      "The image provider could not store this photo.",
    );
  const data = await result.json();
  if (!data.success)
    fail(
      502,
      "upload_failed",
      "The image provider could not store this photo.",
    );
  const f = await prisma.file.create({
    data: {
      clientId,
      key: `images/${data.result.id}`,
      name: file.name.slice(0, 200),
      type: "image",
      size: file.size,
    },
  });
  return {
    id: f.id,
    name: f.name,
    url:
      data.result.variants?.[0] ||
      `https://imagedelivery.net/${process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${data.result.id}/public`,
  };
}
