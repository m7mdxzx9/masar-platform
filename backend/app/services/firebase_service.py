import os
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Lazy load firebase_admin to avoid errors if the package is not installed yet
_firebase_initialized = False

try:
    import firebase_admin
    from firebase_admin import credentials, storage
except ImportError:
    logger.warning("firebase-admin package is not installed. Firebase service will be disabled.")


def initialize_firebase() -> bool:
    global _firebase_initialized
    if _firebase_initialized:
        return True

    # 1. Check if Firebase features are configured in settings
    bucket_name = settings.firebase_bucket_name
    if not bucket_name:
        logger.info("Firebase Storage not configured (FIREBASE_BUCKET_NAME is empty). Falling back to local storage.")
        return False

    try:
        # 2. Check if a local JSON file credentials exist
        json_credentials_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 
            "firebase-credentials.json"
        )

        if os.path.exists(json_credentials_path):
            logger.info(f"Loading Firebase credentials from local file: {json_credentials_path}")
            cred = credentials.Certificate(json_credentials_path)
            firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})
            _firebase_initialized = True
            logger.info(f"🔥 Firebase Admin initialized successfully using bucket: {bucket_name}")
            return True

        # 3. Fallback to loading credentials from individual environment variables
        project_id = settings.firebase_project_id
        client_email = settings.firebase_client_email
        private_key = settings.firebase_private_key

        if project_id and client_email and private_key:
            logger.info("Loading Firebase credentials from environment variables")
            # Replace escaped newlines if entered as string in env variables
            pk = private_key.replace("\\n", "\n")
            cred_dict = {
                "type": "service_account",
                "project_id": project_id,
                "private_key": pk,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred, {"storageBucket": bucket_name})
            _firebase_initialized = True
            logger.info(f"🔥 Firebase Admin initialized successfully using bucket: {bucket_name}")
            return True

        logger.warning(
            "Firebase environment variables missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) "
            "and local firebase-credentials.json not found. Falling back to local storage."
        )
        return False

    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {e}", exc_info=True)
        return False


class FirebaseService:
    def __init__(self):
        self._enabled = initialize_firebase()

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    def upload_file(self, local_path: str, remote_path: str, content_type: Optional[str] = None) -> Optional[str]:
        """
        Uploads a local file to Firebase Storage.
        Returns the public URL if successful, otherwise None (calling code falls back to local storage).
        """
        if not self._enabled:
            return None

        if not os.path.exists(local_path):
            logger.error(f"Local file does not exist: {local_path}")
            return None

        try:
            bucket = storage.bucket()
            blob = bucket.blob(remote_path)
            
            logger.info(f"Uploading file {local_path} to Firebase Storage path: {remote_path}")
            blob.upload_from_filename(local_path, content_type=content_type)
            
            # Make the uploaded file publicly readable
            blob.make_public()
            
            # Return the GCS public URL: https://storage.googleapis.com/{bucket}/{blob_path}
            public_url = blob.public_url
            logger.info(f"File uploaded successfully. Public URL: {public_url}")
            return public_url

        except Exception as e:
            logger.error(f"Firebase Storage upload failed: {e}", exc_info=True)
            return None

    def delete_file(self, remote_url_or_path: str) -> bool:
        """
        Deletes a file from Firebase Storage given its public URL or path.
        """
        if not self._enabled:
            return False

        try:
            bucket_name = settings.firebase_bucket_name
            blob_path = None

            # Extract blob path from public URL if needed
            # e.g., https://storage.googleapis.com/bucket-name/subjects/1/uuid.pdf
            if remote_url_or_path.startswith("http"):
                separator = f"/{bucket_name}/"
                parts = remote_url_or_path.split(separator)
                if len(parts) > 1:
                    blob_path = parts[1]
            else:
                blob_path = remote_url_or_path

            if not blob_path:
                logger.warning(f"Could not parse blob name from URL/path: {remote_url_or_path}")
                return False

            bucket = storage.bucket()
            blob = bucket.blob(blob_path)
            
            logger.info(f"Deleting blob {blob_path} from Firebase Storage...")
            blob.delete()
            logger.info("Blob deleted successfully from Firebase Storage.")
            return True

        except Exception as e:
            logger.error(f"Firebase Storage delete failed for {remote_url_or_path}: {e}", exc_info=True)
            return False


# Singleton instance
firebase_service = FirebaseService()
