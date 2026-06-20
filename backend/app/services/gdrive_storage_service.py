import os
import json
import io
import logging
from typing import Optional
from pathlib import Path
from app.core.config import settings

logger = logging.getLogger(__name__)

GOOGLE_TOKEN_PATH = Path(__file__).resolve().parent.parent.parent / "drive_token.json"


class GoogleDriveStorageService:
    @property
    def is_enabled(self) -> bool:
        """
        True if the user has authenticated and linked their Google Drive account.
        """
        return GOOGLE_TOKEN_PATH.exists()

    def _get_drive_service(self):
        """
        Retrieves the authenticated Google Drive API service.
        """
        if not self.is_enabled:
            return None

        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build
            from google.auth.transport.requests import Request as AuthRequest

            creds_data = json.loads(GOOGLE_TOKEN_PATH.read_text())
            creds = Credentials.from_authorized_user_info(creds_data)
            
            if creds.expired and creds.refresh_token:
                logger.info("Google Drive credentials expired in storage service. Attempting to refresh...")
                try:
                    creds.refresh(AuthRequest())
                    GOOGLE_TOKEN_PATH.write_text(creds.to_json())
                    logger.info("Google Drive credentials refreshed successfully in storage service.")
                except Exception as ex:
                    logger.error(f"Failed to refresh Google Drive credentials in storage service: {ex}")
            
            return build("drive", "v3", credentials=creds)
        except Exception as e:
            logger.error(f"Failed to initialize Google Drive service: {e}", exc_info=True)
            return None

    def upload_file(self, local_path: str, remote_path: str, content_type: Optional[str] = None) -> Optional[str]:
        """
        Uploads a local file to the appropriate folder in the linked Google Drive.
        Returns 'gdrive://{file_id}' if successful, otherwise None.
        """
        if not self.is_enabled:
            return None

        service = self._get_drive_service()
        if not service:
            logger.error("Google Drive service not available.")
            return None

        if not os.path.exists(local_path):
            logger.error(f"Local file does not exist: {local_path}")
            return None

        try:
            from googleapiclient.http import MediaIoBaseUpload
            from app.api.gdrive import _ensure_masar_folder

            root_id = _ensure_masar_folder(service)
            parent_id = root_id
            filename = os.path.basename(remote_path)

            # Determine the target subfolder under Masar/
            folder_name = "Backups"
            if "subjects/" in remote_path:
                folder_name = "Subjects"
            elif "notes/" in remote_path:
                folder_name = "Notes"

            # Check if subfolder exists, otherwise fall back to root_id
            q = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and '{root_id}' in parents and trashed=false"
            folders = service.files().list(q=q, fields="files(id)").execute().get("files", [])
            if folders:
                parent_id = folders[0]["id"]

            logger.info(f"Uploading file {local_path} to Google Drive folder '{folder_name}' as '{filename}'...")

            with open(local_path, "rb") as f:
                content = f.read()

            media = MediaIoBaseUpload(io.BytesIO(content), mimetype=content_type or "application/octet-stream", resumable=True)
            uploaded = service.files().create(
                body={"name": filename, "parents": [parent_id]},
                media_body=media,
                fields="id",
            ).execute()

            file_id = uploaded.get("id")
            if file_id:
                gdrive_url = f"gdrive://{file_id}"
                logger.info(f"File uploaded successfully to Google Drive. URI: {gdrive_url}")
                return gdrive_url
            
            logger.error("Upload failed: No file ID returned from Google Drive API.")
            return None

        except Exception as e:
            logger.error(f"Google Drive upload failed: {e}", exc_info=True)
            return None

    def delete_file(self, remote_url_or_path: str) -> bool:
        """
        Deletes a file from Google Drive using its URI path (e.g. 'gdrive://{file_id}').
        """
        if not self.is_enabled:
            return False

        service = self._get_drive_service()
        if not service:
            return False

        try:
            file_id = None
            if remote_url_or_path.startswith("gdrive://"):
                file_id = remote_url_or_path.replace("gdrive://", "")

            if not file_id:
                logger.warning(f"Could not parse Google Drive file ID from URI: {remote_url_or_path}")
                return False

            logger.info(f"Deleting file {file_id} from Google Drive...")
            service.files().delete(fileId=file_id).execute()
            logger.info("File deleted successfully from Google Drive.")
            return True

        except Exception as e:
            logger.error(f"Google Drive file deletion failed: {e}", exc_info=True)
            return False


# Singleton instance
gdrive_storage_service = GoogleDriveStorageService()
