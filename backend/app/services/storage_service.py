import logging
from app.services.firebase_service import firebase_service
from app.services.supabase_service import supabase_service
from app.services.gdrive_storage_service import gdrive_storage_service

logger = logging.getLogger(__name__)


class UnifiedStorageService:
    @property
    def is_enabled(self) -> bool:
        """
        True if any cloud storage provider (Google Drive, Supabase, or Firebase) is enabled and configured.
        """
        return (
            gdrive_storage_service.is_enabled
            or supabase_service.is_enabled
            or firebase_service.is_enabled
        )

    @property
    def active_provider(self) -> str:
        """
        Returns the name of the currently active storage provider.
        """
        if gdrive_storage_service.is_enabled:
            return "gdrive"
        if supabase_service.is_enabled:
            return "supabase"
        if firebase_service.is_enabled:
            return "firebase"
        return "local"

    def upload_file(self, local_path: str, remote_path: str, content_type: str = None) -> str:
        """
        Uploads a file to the active cloud storage provider (Google Drive preferred first, then Supabase, then Firebase).
        Returns the public URL or URI, or None if it fails or no provider is configured.
        """
        if gdrive_storage_service.is_enabled:
            logger.info("Routing upload to Google Drive...")
            return gdrive_storage_service.upload_file(local_path, remote_path, content_type)

        if supabase_service.is_enabled:
            logger.info("Routing upload to Supabase Storage...")
            return supabase_service.upload_file(local_path, remote_path, content_type)
        
        if firebase_service.is_enabled:
            logger.info("Routing upload to Firebase Storage...")
            return firebase_service.upload_file(local_path, remote_path, content_type)
        
        return None

    def delete_file(self, remote_url_or_path: str) -> bool:
        """
        Deletes a file from the active cloud storage provider based on URL or path.
        """
        if remote_url_or_path.startswith("gdrive://") or gdrive_storage_service.is_enabled:
            # If the file path explicitly starts with gdrive://, or if google drive is linked
            # we should prioritize deleting it from google drive.
            if remote_url_or_path.startswith("gdrive://") or "Masar/" in remote_url_or_path:
                logger.info("Routing delete to Google Drive...")
                return gdrive_storage_service.delete_file(remote_url_or_path)

        if supabase_service.is_enabled:
            logger.info("Routing delete to Supabase Storage...")
            return supabase_service.delete_file(remote_url_or_path)
        
        if firebase_service.is_enabled:
            logger.info("Routing delete to Firebase Storage...")
            return firebase_service.delete_file(remote_url_or_path)
        
        return False


# Singleton instance
storage_service = UnifiedStorageService()
