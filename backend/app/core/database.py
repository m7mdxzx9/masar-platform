from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text, select
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,    # Recycle connections after 30 minutes
    pool_timeout=30,      # Wait up to 30s before giving up on getting a connection
)

# Optional Read Replica Engine
read_engine = None
if settings.read_database_url:
    read_engine = create_async_engine(
        settings.read_database_url,
        echo=settings.database_echo,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_timeout=30,
    )

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async_read_session_factory = async_sessionmaker(
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
    async with engine.begin() as conn:
        if settings.pgvector_enabled:
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                logger.info("pgvector extension enabled")
            except Exception as e:
                logger.warning(f"Could not enable pgvector extension: {e}")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully")

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
