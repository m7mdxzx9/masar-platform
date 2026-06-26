import re
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url: str) -> str:
    """
    Extracts the 11-character video ID from a standard, mobile, shorts, or embed YouTube URL.
    """
    pattern = r'(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})'
    match = re.search(pattern, url)
    if match:
        return match.group(1)
    raise ValueError("رابط يوتيوب غير صالح.")

def get_youtube_transcript(url: str) -> str:
    """
    Fetches transcripts for a given YouTube URL using youtube-transcript-api.
    Prefers Arabic, then English, then falls back to any available transcript.
    """
    video_id = extract_video_id(url)
    
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try Arabic manually created or auto-generated
        try:
            transcript = transcript_list.find_transcript(['ar'])
        except Exception:
            # Try English
            try:
                transcript = transcript_list.find_transcript(['en'])
            except Exception:
                # Fallback to the first available transcript in the list
                transcript = transcript_list.find_generated_transcript(transcript_list._generated_transcripts.keys())
                
        data = transcript.fetch()
        text = " ".join([item['text'] for item in data])
        return text
    except Exception as e:
        raise Exception(f"لا توجد ترجمة مصاحبة (Captions) مفعلة لهذا الفيديو: {str(e)}")
