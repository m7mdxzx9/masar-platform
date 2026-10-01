"""Offline API regression suite: python -m unittest discover -s backend/tests -p test_offline_crud.py.

Uses an in-memory database and a disabled storage adapter; never opens the saved
database or imports the AI application services.
"""
import os
import sys
import types
import unittest
from unittest.mock import patch, mock_open

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["READ_DATABASE_URL"] = ""
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker
from app.core import database
from app.models import models


class OfflineCrudTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = database.create_database_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as connection:
            await connection.run_sync(database.Base.metadata.create_all)
        self.factory = async_sessionmaker(self.engine, expire_on_commit=False)
        self.previous_factory = database.async_session_factory.active_factory
        database.async_session_factory.active_factory = self.factory
        storage = types.ModuleType("app.services.storage_service")
        storage.storage_service = types.SimpleNamespace(is_enabled=False)
        self.storage_patch = patch.dict(sys.modules, {"app.services.storage_service": storage})
        self.storage_patch.start()
        from app.api import goals, notes, subjects, focus
        app = FastAPI()
        for router in (goals.router, notes.router, subjects.router, focus.router):
            app.include_router(router, prefix="/api/v1")
        self.client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        database.async_session_factory.active_factory = self.previous_factory
        self.storage_patch.stop()
        await self.engine.dispose()

    async def test_goal_crud_and_clear_deadline(self):
        response = await self.client.post("/api/v1/goals", json={"title": "Study", "deadline": "2026-10-12T10:00:00Z"})
        self.assertEqual(response.status_code, 200, response.text)
        goal_id = response.json()["id"]
        response = await self.client.put(f"/api/v1/goals/{goal_id}", json={"current": 1, "deadline": None})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertIsNone(response.json()["deadline"])
        self.assertEqual(response.json()["current"], 1)
        self.assertEqual(len((await self.client.get("/api/v1/goals")).json()), 1)
        self.assertEqual((await self.client.delete(f"/api/v1/goals/{goal_id}")).status_code, 200)
        self.assertEqual((await self.client.get(f"/api/v1/goals/{goal_id}")).status_code, 404)

    async def test_notes_crud_search_and_invalid_title(self):
        created = await self.client.post("/api/v1/notes/", json={"title": "مراجعة", "content": "ملاحظات الدرس"})
        self.assertEqual(created.status_code, 200, created.text)
        note_id = created.json()["id"]
        self.assertEqual(len((await self.client.get("/api/v1/notes/", params={"search": "مراجعة"})).json()["notes"]), 1)
        for title in ("", None):
            self.assertEqual((await self.client.put(f"/api/v1/notes/{note_id}", json={"title": title})).status_code, 422)
        updated = await self.client.put(f"/api/v1/notes/{note_id}", json={"content": "Updated"})
        self.assertEqual(updated.json()["content"], "Updated")
        self.assertEqual((await self.client.delete(f"/api/v1/notes/{note_id}")).status_code, 200)
        self.assertEqual((await self.client.get(f"/api/v1/notes/{note_id}")).status_code, 404)

    async def test_subject_crud_and_invalid_name(self):
        created = await self.client.post("/api/v1/subjects/", json={"name": "Algorithms", "code": "CS101"})
        self.assertEqual(created.status_code, 200, created.text)
        subject_id = created.json()["id"]
        listed = (await self.client.get("/api/v1/subjects/")).json()["subjects"]
        self.assertEqual(listed[0]["file_count"], 0)
        for name in ("", None):
            self.assertEqual((await self.client.put(f"/api/v1/subjects/{subject_id}", json={"name": name})).status_code, 422)
        self.assertEqual((await self.client.put(f"/api/v1/subjects/{subject_id}", json={"name": "Updated"})).json()["name"], "Updated")
        self.assertEqual((await self.client.delete(f"/api/v1/subjects/{subject_id}")).status_code, 200)
        self.assertEqual((await self.client.get(f"/api/v1/subjects/{subject_id}")).status_code, 404)

    async def test_focus_stats_count_only_completed_focus(self):
        for session_type, completed, duration in (("focus", True, 1500), ("break", True, 300), ("focus", False, 600)):
            response = await self.client.post("/api/v1/focus/sessions", json={"session_type": session_type, "completed": completed, "duration": duration})
            self.assertEqual(response.status_code, 200, response.text)
        stats = (await self.client.get("/api/v1/focus/stats")).json()
        self.assertEqual(stats["today_seconds"], 1500)
        self.assertEqual(stats["session_count_today"], 1)
        self.assertEqual((await self.client.get("/api/v1/focus/sessions", params={"limit": -1})).status_code, 422)
        self.assertEqual((await self.client.get("/api/v1/focus/heatmap", params={"days": -1})).status_code, 422)

    async def test_invalid_goal_fields_are_rejected(self):
        self.assertEqual((await self.client.post("/api/v1/goals", json={"title": ""})).status_code, 422)
        goal_id = (await self.client.post("/api/v1/goals", json={"title": "Valid"})).json()["id"]
        self.assertEqual((await self.client.put(f"/api/v1/goals/{goal_id}", json={"title": None})).status_code, 422)

    async def test_voice_note_survives_unavailable_transcription(self):
        from app.api import notes
        transcription = types.ModuleType("app.services.transcription_service")
        def unavailable(_path):
            raise RuntimeError("Offline transcription unavailable")
        transcription.transcribe_audio_file = unavailable
        with patch("app.api.notes.os.makedirs"), patch("builtins.open", mock_open()), patch.dict(sys.modules, {"app.services.transcription_service": transcription}):
            response = await self.client.post("/api/v1/notes/voice", data={"title": "Voice", "duration": "5"}, files={"file": ("note.webm", b"offline-test-audio", "audio/webm")})
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(response.json()["type"], "voice")
            self.assertEqual(response.json()["content"], "")


if __name__ == "__main__":
    unittest.main()
