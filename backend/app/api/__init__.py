"""Load API modules on demand so independent endpoints do not initialize AI services."""
from importlib import import_module

_ROUTER_MODULES = {
    name: name.removesuffix("_router")
    for name in (
        "agents_router", "courses_router", "labs_router", "games_router",
        "knowledge_router", "calendar_router", "schedule_router", "progress_router",
        "projects_router", "translate_router", "gdrive_router", "analytics_router",
        "tutor_router", "labs_enhanced_router",
    )
}


def __getattr__(name):
    if name in _ROUTER_MODULES:
        router = import_module(f".{_ROUTER_MODULES[name]}", __name__).router
        globals()[name] = router
        return router
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
