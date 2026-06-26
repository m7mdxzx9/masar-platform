import json
import io
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/labs", tags=["AI Smart Lab - Enhanced"])


class NotebookExportRequest(BaseModel):
    cells: list[dict] = Field(..., description="List of cells: [{code, output, error}]")
    title: str = Field(default="Masar Lab Notebook")


class VariableSnapshot(BaseModel):
    name: str
    value: str
    type: str


@router.post("/export-ipynb")
async def export_notebook(req: NotebookExportRequest):
    try:
        nb_cells = []
        for cell in req.cells:
            cell_type = cell.get("type", "code")
            source = cell.get("code", "").split("\n")
            if cell_type == "markdown":
                nb_cells.append({
                    "cell_type": "markdown",
                    "metadata": {},
                    "source": [line + "\n" for line in source if line] if not source == [""] else [],
                })
            else:
                nb_cells.append({
                    "cell_type": "code",
                    "execution_count": None,
                    "metadata": {},
                    "outputs": [
                        {
                            "name": "stdout",
                            "output_type": "stream",
                            "text": cell.get("output", "").split("\n"),
                        }
                    ] if cell.get("output") else [],
                    "source": [line + "\n" for line in source],
                })

        notebook = {
            "nbformat": 4,
            "nbformat_minor": 5,
            "metadata": {
                "kernelspec": {
                    "display_name": "Python 3",
                    "language": "python",
                    "name": "python3",
                },
                "language_info": {
                    "name": "python",
                    "version": "3.10.0",
                },
            },
            "cells": nb_cells,
        }

        content = json.dumps(notebook, ensure_ascii=False, indent=1)
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="application/x-ipynb+json",
            headers={"Content-Disposition": f'attachment; filename="{req.title}.ipynb"'},
        )
    except Exception as e:
        logger.error(f"Notebook export error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import-ipynb")
async def import_notebook(file: UploadFile = File(...)):
    try:
        content = await file.read()
        notebook = json.loads(content)

        if notebook.get("nbformat") != 4:
            raise HTTPException(status_code=400, detail="Only Jupyter Notebook v4 is supported")

        cells = []
        for nb_cell in notebook.get("cells", []):
            cell_type = nb_cell.get("cell_type", "code")
            source = "".join(nb_cell.get("source", []))
            if cell_type == "markdown":
                cells.append({
                    "type": "markdown",
                    "code": source,
                    "output": "",
                    "error": "",
                })
            else:
                outputs = []
                for output in nb_cell.get("outputs", []):
                    text = output.get("text", [])
                    if isinstance(text, list):
                        text = "".join(text)
                    if text:
                        outputs.append(text)
                cells.append({
                    "type": "code",
                    "code": source,
                    "output": "\n".join(outputs),
                    "error": "",
                })

        return {"cells": cells, "title": file.filename.replace(".ipynb", ""), "cell_count": len(cells)}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid .ipynb file")
    except Exception as e:
        logger.error(f"Notebook import error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
