import sqlite3
import hashlib
import os
import logging
import json
import math

logger = logging.getLogger(__name__)

CACHE_DB_PATH = "C:/Users/HP/.gemini/antigravity/brain/655f2dbb-f2b8-4f4a-ac2f-4baab7cdd533/llm_cache.db"

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)

class LLMCache:
    def __init__(self):
        try:
            os.makedirs(os.path.dirname(CACHE_DB_PATH), exist_ok=True)
            self.conn = sqlite3.connect(CACHE_DB_PATH, check_same_thread=False)
            self.create_table()
        except Exception as e:
            logger.warning(f"Failed to initialize SQLite Cache at {CACHE_DB_PATH}, using fallback in-memory cache. Error: {e}")
            self.conn = sqlite3.connect(":memory:", check_same_thread=False)
            self.create_table()

    def create_table(self):
        with self.conn:
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS cache (
                    prompt_hash TEXT PRIMARY KEY,
                    prompt TEXT,
                    response TEXT,
                    agent_type TEXT,
                    embedding TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            try:
                self.conn.execute("ALTER TABLE cache ADD COLUMN embedding TEXT")
            except sqlite3.OperationalError:
                # Column already exists
                pass

    def _hash(self, prompt: str, agent_type: str) -> str:
        normalized = prompt.strip().lower()
        return hashlib.sha256(f"{agent_type}:{normalized}".encode("utf-8")).hexdigest()

    async def get(self, prompt: str, agent_type: str) -> str | None:
        try:
            # 1. Exact match first (SHA-256)
            h = self._hash(prompt, agent_type)
            cursor = self.conn.cursor()
            cursor.execute("SELECT response FROM cache WHERE prompt_hash = ?", (h,))
            row = cursor.fetchone()
            if row:
                logger.info(f"[Semantic Cache] Exact HIT for agent_type='{agent_type}', prompt_hash='{h}'")
                return row[0]

            # 2. Semantic Similarity Check
            from app.services.agents.embedding_factory import embed_text
            prompt_vector = await embed_text(prompt)
            if not prompt_vector or not any(prompt_vector):
                logger.info(f"[Semantic Cache] MISS for agent_type='{agent_type}' (Could not embed prompt)")
                return None

            cursor.execute(
                "SELECT response, embedding, prompt FROM cache WHERE agent_type = ? AND embedding IS NOT NULL",
                (agent_type,)
            )
            rows = cursor.fetchall()
            
            best_similarity = -1.0
            best_response = None
            best_prompt = None
            
            for response, emb_str, cached_prompt in rows:
                try:
                    emb = json.loads(emb_str)
                    sim = cosine_similarity(prompt_vector, emb)
                    if sim > best_similarity:
                        best_similarity = sim
                        best_response = response
                        best_prompt = cached_prompt
                except Exception as e:
                    logger.warning(f"Error parsing cached embedding: {e}")
                    continue
            
            # Threshold for semantic similarity
            THRESHOLD = 0.88
            if best_similarity >= THRESHOLD:
                logger.info(
                    f"[Semantic Cache] Semantic HIT for agent_type='{agent_type}'. "
                    f"Similarity: {best_similarity:.2f} (Matched: '{best_prompt}')"
                )
                return best_response
            
            logger.info(f"[Semantic Cache] MISS for agent_type='{agent_type}' (Best similarity: {best_similarity:.2f})")
            return None
        except Exception as e:
            logger.warning(f"[Semantic Cache] get error: {e}")
            return None

    async def set(self, prompt: str, agent_type: str, response: str):
        try:
            h = self._hash(prompt, agent_type)
            from app.services.agents.embedding_factory import embed_text
            prompt_vector = await embed_text(prompt)
            
            emb_str = None
            if prompt_vector and any(prompt_vector):
                emb_str = json.dumps(prompt_vector)
                
            with self.conn:
                self.conn.execute(
                    "INSERT OR REPLACE INTO cache (prompt_hash, prompt, response, agent_type, embedding) VALUES (?, ?, ?, ?, ?)",
                    (h, prompt, response, agent_type, emb_str)
                )
            logger.info(f"[Semantic Cache] STORED for agent_type='{agent_type}', prompt_hash='{h}'")
        except Exception as e:
            logger.warning(f"[Semantic Cache] set error: {e}")

llm_cache = LLMCache()
