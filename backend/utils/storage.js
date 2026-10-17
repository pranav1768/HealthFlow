/**
 * Thin wrapper around Supabase Storage for medical record attachments.
 *
 * Pattern: store only the storagePath in MongoDB (see Record model).
 * Generate a fresh signed URL on every read — never persist a signed URL,
 * since they expire and persisting one would silently break later.
 *
 * Requires @supabase/supabase-js and these env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server-side only — never expose to frontend)
 *   SUPABASE_STORAGE_BUCKET     (e.g. "medical-records")
 */

let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  // Lazy require so the app can boot even before this package is installed,
  // matching the "no payment SDK installed yet" style of incremental setup.
  const { createClient } = require('@supabase/supabase-js');

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in environment variables.');
  }

  supabaseClient = createClient(url, serviceKey);
  return supabaseClient;
}

const SIGNED_URL_EXPIRY_SECONDS = 60 * 10; // 10 minutes — long enough to view/download, short enough to limit exposure

async function uploadAttachment(buffer, storagePath, mimeType) {
  const supabase = getSupabaseClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'medical-records';

  let result;
  try {
    result = await supabase.storage.from(bucket).upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });
  } catch (networkErr) {
    throw new Error(
      'Could not reach Supabase Storage. Check your SUPABASE_URL and network connection, then try again.'
    );
  }

  if (result.error) throw new Error(`Supabase upload failed: ${result.error.message}`);
  return storagePath;
}

async function getSignedUrl(storagePath) {
  const supabase = getSupabaseClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

  if (error) throw new Error(`Supabase signed URL generation failed: ${error.message}`);
  return data.signedUrl;
}

async function deleteAttachment(storagePath) {
  const supabase = getSupabaseClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}

module.exports = { uploadAttachment, getSignedUrl, deleteAttachment };
