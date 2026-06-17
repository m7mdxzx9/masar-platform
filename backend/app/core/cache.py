import json
import logging
from typing import Any, Optional
import redis.asyncio as redis
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None

    async def init(self):
        if not self.redis:
            try:
                self.redis = redis.from_url(settings.redis_url, decode_responses=True)
                await self.redis.ping()
                logger.info("Redis cache initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Redis: {e}")
                self.redis = None

    async def close(self):
        if self.redis:
            await self.redis.close()

    async def get(self, key: str) -> Optional[Any]:
        if not self.redis:
            return None
        try:
            val = await self.redis.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.warning(f"Cache get error for key {key}: {e}")
        return None

    async def set(self, key: str, value: Any, expire: int = 3600):
        if not self.redis:
            return
        try:
            await self.redis.set(key, json.dumps(value), ex=expire)
        except Exception as e:
            logger.warning(f"Cache set error for key {key}: {e}")

    async def delete(self, key: str):
        if not self.redis:
            return
        try:
            await self.redis.delete(key)
        except Exception as e:
            logger.warning(f"Cache delete error for key {key}: {e}")

cache = CacheManager()
