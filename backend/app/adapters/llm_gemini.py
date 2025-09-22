"""Google Gemini LLM adapter."""

import os
import logging
import json
from typing import Optional

from .llm_base import LLMAdapter

logger = logging.getLogger(__name__)


class GeminiAdapter(LLMAdapter):
    """Adapter for Google's Gemini API."""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment")

        self._model = None

    def _get_model(self):
        """Lazy initialization of Gemini model."""
        if self._model is None:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._model = genai.GenerativeModel('gemini-pro')
            except ImportError:
                raise ImportError("google-generativeai package not installed. Run: pip install google-generativeai")
        return self._model

    async def _call_model(
        self,
        prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 4096,
        json_mode: bool = True
    ) -> str:
        """Call Google's Gemini API."""
        model = self._get_model()

        if json_mode:
            prompt = f"""You must respond with ONLY valid JSON, no markdown formatting.

{prompt}

Remember: Output ONLY raw JSON, no ```json``` tags, no explanations."""

        try:
            generation_config = {
                "temperature": temperature,
                "max_output_tokens": max_tokens,
                "top_p": 0.1 if temperature == 0.0 else 0.95,
                "top_k": 1 if temperature == 0.0 else 40,
            }

            response = model.generate_content(
                prompt,
                generation_config=generation_config
            )

            response_text = response.text if response else ""

            logger.debug(f"Gemini response length: {len(response_text)}")
            return response_text

        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}", exc_info=False)
            raise Exception(f"Failed to call Gemini API: {str(e)}")