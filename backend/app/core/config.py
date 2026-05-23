from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List, Optional, Literal


class Settings(BaseSettings):
    app_name: str = "Masar API"
    app_version: str = "3.0.0"
    debug: bool = Field(default=False, alias="DEBUG")
    environment: str = Field(default="development", alias="ENVIRONMENT")

    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        alias="CORS_ORIGINS",
    )

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/masar",
        alias="DATABASE_URL",
    )

    @field_validator("database_url", mode="after")
    @classmethod
    def convert_database_url_to_asyncpg(cls, v: str) -> str:
        """Render provides postgres:// URLs which default to psycopg2.
        We need postgresql+asyncpg:// for our async SQLAlchemy engine."""
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql+psycopg2://"):
            return v.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
        return v

    database_echo: bool = Field(default=False, alias="DATABASE_ECHO")

    pgvector_enabled: bool = Field(default=True, alias="PGVECTOR_ENABLED")

    chroma_host: str = Field(default="localhost", alias="CHROMA_HOST")
    chroma_port: int = Field(default=8000, alias="CHROMA_PORT")
    chroma_collection_name: str = Field(
        default="masar_knowledge", alias="CHROMA_COLLECTION_NAME"
    )

    vector_store_backend: Literal["pgvector", "chromadb"] = Field(
        default="pgvector", alias="VECTOR_STORE_BACKEND"
    )

    llm_provider: Literal["nvidia", "ollama", "openrouter"] = Field(
        default="ollama", alias="LLM_PROVIDER"
    )

    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(
        default="openrouter/auto", alias="OPENROUTER_MODEL"
    )
    openrouter_fallback_model: str = Field(
        default="deepseek/deepseek-r1:free", alias="OPENROUTER_FALLBACK_MODEL"
    )
    openrouter_base_url: str = Field(
        default="https://openrouter.ai/api/v1", alias="OPENROUTER_BASE_URL"
    )

    nvidia_api_key: str = Field(default="", alias="NVIDIA_API_KEY")
    nvidia_model: str = Field(
        default="meta/llama-3.1-70b-instruct", alias="NVIDIA_MODEL"
    )
    nvidia_base_url: str = Field(
        default="https://integrate.api.nvidia.com/v1", alias="NVIDIA_BASE_URL"
    )
    nvidia_embedding_model: str = Field(
        default="nvidia/nv-embedqa-e5-v5", alias="NVIDIA_EMBEDDING_MODEL"
    )

    ollama_base_url: str = Field(
        default="http://localhost:11434", alias="OLLAMA_BASE_URL"
    )
    ollama_model: str = Field(default="llama3.1:8b", alias="OLLAMA_MODEL")
    ollama_embedding_model: str = Field(
        default="nomic-embed-text", alias="OLLAMA_EMBEDDING_MODEL"
    )

    vllm_base_url: str = Field(
        default="http://localhost:8000/v1", alias="VLLM_BASE_URL"
    )
    vllm_model: str = Field(default="", alias="VLLM_MODEL")
    vllm_api_key: str = Field(default="EMPTY", alias="VLLM_API_KEY")

    embedding_provider: Literal["nvidia", "ollama"] = Field(
        default="ollama", alias="EMBEDDING_PROVIDER"
    )
    embedding_dimension: int = Field(default=768, alias="EMBEDDING_DIMENSION")

    llm_temperature: float = Field(default=0.7, alias="LLM_TEMPERATURE")
    llm_max_tokens: int = Field(default=2048, alias="LLM_MAX_TOKENS")

    rag_chunk_size: int = Field(default=512, alias="RAG_CHUNK_SIZE")
    rag_chunk_overlap: int = Field(default=64, alias="RAG_CHUNK_OVERLAP")
    rag_top_k: int = Field(default=5, alias="RAG_TOP_K")

    upload_dir: str = Field(default="./uploads", alias="UPLOAD_DIR")
    
    uqu_username: str = Field(default="", alias="UQU_USERNAME")
    uqu_password: str = Field(default="", alias="UQU_PASSWORD")

    google_drive_client_id: str = Field(default="", alias="GOOGLE_DRIVE_CLIENT_ID")
    google_drive_client_secret: str = Field(default="", alias="GOOGLE_DRIVE_CLIENT_SECRET")
    google_drive_redirect_uri: str = Field(
        default="http://localhost:5173/drive/callback",
        alias="GOOGLE_DRIVE_REDIRECT_URI",
    )

    @property
    def allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def effective_llm_base_url(self) -> str:
        if self.llm_provider == "nvidia":
            return self.nvidia_base_url
        if self.llm_provider == "openrouter":
            return self.openrouter_base_url
        return self.ollama_base_url

    @property
    def effective_llm_model(self) -> str:
        if self.llm_provider == "nvidia":
            return self.nvidia_model
        if self.llm_provider == "openrouter":
            return self.openrouter_model
        return self.ollama_model

    @property
    def effective_llm_api_key(self) -> Optional[str]:
        if self.llm_provider == "nvidia":
            return self.nvidia_api_key or None
        if self.llm_provider == "openrouter":
            return self.openrouter_api_key or None
        return "ollama"

    @property
    def effective_embedding_base_url(self) -> str:
        if self.embedding_provider == "nvidia":
            return self.nvidia_base_url
        return self.ollama_base_url

    @property
    def effective_embedding_model(self) -> str:
        if self.embedding_provider == "nvidia":
            return self.nvidia_embedding_model
        return self.ollama_embedding_model

    @property
    def effective_embedding_api_key(self) -> Optional[str]:
        if self.embedding_provider == "nvidia":
            return self.nvidia_api_key or None
        return "ollama"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }


settings = Settings()
