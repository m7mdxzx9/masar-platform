from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text, select
from app.core.config import settings
import logging
import os
import asyncio

logger = logging.getLogger(__name__)

# Check if sslmode was requested in env database URL and configure asyncpg connect_args
connect_args = {}
db_url_env = os.environ.get("DATABASE_URL", "")
if "sslmode=require" in db_url_env or "sslmode=" in db_url_env:
    connect_args["ssl"] = "require"

engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    connect_args=connect_args,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,    # Recycle connections after 30 minutes
    pool_timeout=30,      # Wait up to 30s before giving up on getting a connection
)

# Optional Read Replica Engine
read_engine = None
if settings.read_database_url:
    read_connect_args = {}
    read_db_url_env = os.environ.get("READ_DATABASE_URL", "")
    if "sslmode=require" in read_db_url_env or "sslmode=" in read_db_url_env:
        read_connect_args["ssl"] = "require"
    read_engine = create_async_engine(
        settings.read_database_url,
        echo=settings.database_echo,
        connect_args=read_connect_args,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_timeout=30,
    )

class SessionFactoryProxy:
    def __init__(self):
        self.active_factory = None

    def __call__(self, *args, **kwargs):
        if self.active_factory is None:
            raise RuntimeError("SessionFactoryProxy not initialized")
        return self.active_factory(*args, **kwargs)

async_session_factory = SessionFactoryProxy()
async_read_session_factory = SessionFactoryProxy()

async_session_factory.active_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async_read_session_factory.active_factory = async_sessionmaker(
    read_engine if read_engine else engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    """Get a database session for writing/reading."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

async def get_read_db():
    """Get a database session specifically for reading operations."""
    async with async_read_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    global engine, async_session_factory, async_read_session_factory
    # Import all models to ensure they are registered on the Base metadata
    from app.models import models
    max_retries = 3
    retry_delay = 2
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Database connection attempt {attempt}/{max_retries}...")
            async with engine.begin() as conn:
                if settings.pgvector_enabled and not str(engine.url).startswith("sqlite"):
                    try:
                        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                        logger.info("pgvector extension enabled")
                    except Exception as e:
                        logger.warning(f"Could not enable pgvector extension: {e}")
                await conn.run_sync(Base.metadata.create_all)
                
                # Self-healing migrations for existing installations:
                # Add user_id column to existing tables if they don't have it
                if not str(engine.url).startswith("sqlite"):
                    tables_needing_user_id = [
                        "courses", "subjects", "notes", "goals", "schedule_courses",
                        "vocabulary_words", "game_matches", "ai_chat_messages", "chat_sessions"
                    ]
                    for table in tables_needing_user_id:
                        try:
                            await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE DEFAULT 1"))
                            logger.info(f"Self-healing: Ensured user_id column exists in {table} table")
                        except Exception as ex:
                            logger.warning(f"Self-healing: Could not add user_id column to {table} table: {ex}")
                            
                logger.info("Database initialized successfully")
            break
        except Exception as e:
            if attempt == max_retries:
                logger.warning("Failed to connect to PostgreSQL database. Falling back to local SQLite database...")
                try:
                    sqlite_url = "sqlite+aiosqlite:///./masar.db"
                    logger.info(f"Creating fallback SQLite engine: {sqlite_url}")
                    engine = create_async_engine(
                        sqlite_url,
                        echo=settings.database_echo,
                    )
                    async_session_factory.active_factory = async_sessionmaker(
                        engine,
                        class_=AsyncSession,
                        expire_on_commit=False,
                    )
                    async_read_session_factory.active_factory = async_sessionmaker(
                        engine,
                        class_=AsyncSession,
                        expire_on_commit=False,
                    )
                    async with engine.begin() as conn:
                        await conn.run_sync(Base.metadata.create_all)
                        logger.info("SQLite Database initialized successfully")
                except Exception as ex:
                    logger.critical(f"SQLite initialization failed: {ex}")
                    raise ex
            else:
                logger.warning(f"Database connection failed: {e}. Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)

    # Seed default user with ID = 1 if it doesn't exist
    from app.models.models import User
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.id == 1))
        user = result.scalar_one_or_none()
        if not user:
            logger.info("Seeding default user...")
            default_user = User(
                id=1,
                username="masar_user",
                email="user@masar.ai",
                hashed_password="mock_hashed_password"  # Single-user mode: password is not enforced strictly
            )
            session.add(default_user)
            await session.commit()
            logger.info("Default user seeded successfully")
