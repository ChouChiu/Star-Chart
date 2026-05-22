// R2 (Cloudflare) client — uses Bun's built-in S3Client.
// Requires env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME

const SVG_CONTENT_TYPE = "image/svg+xml";
const CACHE_MAX_AGE = 259200; // 3 days in seconds

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function bucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("Missing R2_BUCKET_NAME env var.");
  return bucket;
}

/** Upload an SVG to R2. Key is the object path, e.g. "star-charts/owner/repo/chart.svg". */
export async function uploadSvg(key: string, svg: string): Promise<void> {
  const client = getClient();
  const file = new File([svg], key, { type: SVG_CONTENT_TYPE });
  await client.write(key, file, {
    bucket: bucketName(),
    type: SVG_CONTENT_TYPE,
    cacheControl: `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`,
  });
}

/** Check if an object exists in R2 and return its age in hours. Returns null if not found. */
export async function getSvgAgeHours(key: string): Promise<number | null> {
  const client = getClient();
  try {
    const obj = await client.file(key).stat();
    const lastModified = obj.lastModified;
    if (!lastModified) return null;
    const ageMs = Date.now() - lastModified.getTime();
    return ageMs / (1000 * 60 * 60);
  } catch {
    return null;
  }
}

/** Fetch an SVG from R2. Returns null if not found. */
export async function fetchSvg(key: string): Promise<string | null> {
  const client = getClient();
  try {
    return await client.file(key).text();
  } catch {
    return null;
  }
}

/** Build the public URL for an R2 object. */
export function publicUrl(key: string): string {
  const custom = process.env.R2_PUBLIC_URL;
  if (custom) {
    const base = custom.replace(/\/$/, "");
    return `${base}/${key}`;
  }
  const accountId = process.env.R2_ACCOUNT_ID;
  return `https://pub-${accountId}.r2.dev/${key}`;
}
