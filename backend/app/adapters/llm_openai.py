"""OpenAI GPT LLM adapter."""

import os
import logging
import json
from typing import Optional

from .llm_base import LLMAdapter

logger = logging.getLogger(__name__)


class OpenAIAdapter(LLMAdapter):
    """Adapter for OpenAI's GPT API."""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment")

        self._client = None

    def _get_client(self):
        """Lazy initialization of OpenAI client."""
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("openai package not installed. Run: pip install openai")
        return self._client

    async def _call_model(
        self,
        prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 4096,
        json_mode: bool = True
    ) -> str:
        """Call OpenAI's GPT API."""
        client = self._get_client()

        system_prompt = "You are a medical data analyst. Always respond with valid JSON only."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        try:
            kwargs = {
                "model": "gpt-4-1106-preview",
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}

            response = client.chat.completions.create(**kwargs)

            response_text = response.choices[0].message.content if response.choices else ""

            logger.debug(f"OpenAI response length: {len(response_text)}")
            return response_text

        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}", exc_info=False)
            raise Exception(f"Failed to call OpenAI API: {str(e)}")