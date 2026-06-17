import os
import httpx
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    def __init__(self):
        self.url = settings.supabase_url.rstrip('/') if settings.supabase_url else ""
        self.key = settings.supabase_key
        self.bucket = settings.supabase_bucket
        self._enabled = bool(self.url and self.key and self.bucket)
        if self._enabled:
            logger.info(f"⚡ Supabase Storage initialized successfully using bucket: {self.bucket}")
        else:
            logger.info("Supabase Storage is not configured (SUPABASE_URL, SUPABASE_KEY, or SUPABASE_BUCKET is empty).")

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    def upload_file(self, local_path: str, remote_path: str, content_type: Optional[str] = None) -> Optional[str]:
        """
        Uploads a local file to Supabase Storage.
        Returns the public URL if successful, otherwise None.
        """
        if not self._enabled:
            return None

        if not os.path.exists(local_path):
            logger.error(f"Local file does not exist: {local_path}")
            return None

        # Supabase REST upload endpoint: https://[project-id].supabase.co/storage/v1/object/[bucket]/[path]
        url = f"{self.url}/storage/v1/object/{self.bucket}/{remote_path}"
        headers = {
            "Authorization": f"Bearer {self.key}",
            "ApiKey": self.key,
        }
        if content_type:
            headers["Content-Type"] = content_type

        try:
            with open(local_path, "rb") as f:
                file_data = f.read()

            logger.info(f"Uploading file {local_path} to Supabase Storage path: {remote_path}")
            # We perform a POST request to upload the file to Supabase Storage
            response = httpx.post(url, headers=headers, content=file_data, timeout=30.0)
            
            if response.status_code == 200:
                # File uploaded successfully.
                # Public URL is: https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[path]
                public_url = f"{self.url}/storage/v1/object/public/{self.bucket}/{remote_path}"
                logger.info(f"File uploaded successfully. Public URL: {public_url}")
                return public_url
            else:
                # If file already exists, Supabase returns 400. Let's try upsert if needed, or log failure.
                logger.error(f"Supabase upload failed with status {response.status_code}: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Supabase upload failed: {e}", exc_info=True)
            return None

    def delete_file(self, remote_url_or_path: str) -> bool:
        """
        Deletes a file from Supabase Storage given its public URL or path.
        """
        if not self._enabled:
            return False

        try:
            # Extract path from URL if it's a URL
            # e.g., https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[path]
            blob_path = None
            prefix = f"/storage/v1/object/public/{self.bucket}/"
            
            if remote_url_or_path.startswith("http"):
                if prefix in remote_url_or_path:
                    blob_path = remote_url_or_path.split(prefix)[1]
            else:
                blob_path = remote_url_or_path

            if not blob_path:
                logger.warning(f"Could not parse blob name from URL/path: {remote_url_or_path}")
                return False

            url = f"{self.url}/storage/v1/object/{self.bucket}/{blob_path}"
            headers = {
                "Authorization": f"Bearer {self.key}",
                "ApiKey": self.key,
            }
            
            logger.info(f"Deleting blob {blob_path} from Supabase Storage...")
            response = httpx.delete(url, headers=headers, timeout=30.0)
            
            if response.status_code == 200:
                logger.info(f"Blob {blob_path} deleted successfully from Supabase Storage.")
                return True
            else:
                logger.error(f"Supabase delete failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Supabase delete failed for {remote_url_or_path}: {e}", exc_info=True)
            return False


# Singleton instance
supabase_service = SupabaseService()
