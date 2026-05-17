import os
import logging
from typing import Optional

from llama_index.core import SimpleDirectoryReader, Document
from llama_index.core.node_parser import SentenceSplitter

from app.core.config import settings

logger = logging.getLogger(__name__)


def load_file(filepath: str) -> list[Document]:
    ext = os.path.splitext(filepath)[1].lower()
    if ext == ".pdf":
        try:
            from llama_index.readers.file import PDFReader

            reader = PDFReader()
            docs = reader.load_data(file=filepath)
            logger.info(f"Loaded PDF: {filepath} -> {len(docs)} documents")
            return docs
        except ImportError:
            logger.warning("PDFReader not available, falling back to SimpleDirectoryReader")

    parent_dir = os.path.dirname(filepath)
    filename = os.path.basename(filepath)
    reader = SimpleDirectoryReader(input_dir=parent_dir, input_files=[filename])
    docs = reader.load_data()
    logger.info(f"Loaded file: {filepath} -> {len(docs)} documents")
    return docs


def load_text(text: str, title: str = "untitled") -> list[Document]:
    doc = Document(text=text, metadata={"title": title})
    return [doc]


def chunk_documents(
    documents: list[Document],
    chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None,
) -> list[str]:
    size = chunk_size or settings.rag_chunk_size
    overlap = chunk_overlap or settings.rag_chunk_overlap

    parser = SentenceSplitter(
        chunk_size=size,
        chunk_overlap=overlap,
    )
    nodes = parser.get_nodes_from_documents(documents)
    chunks = [node.get_content(metadata_mode="none") for node in nodes]
    logger.info(f"Chunked {len(documents)} documents into {len(chunks)} chunks (size={size}, overlap={overlap})")
    return chunks
