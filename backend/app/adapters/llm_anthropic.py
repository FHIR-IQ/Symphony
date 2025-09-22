"""Anthropic Claude LLM adapter."""

import os
import logging
from typing import Optional

from .llm_base import LLMAdapter

logger = logging.getLogger(__name__)


class AnthropicAdapter(LLMAdapter):
    """Adapter for Anthropic's Claude API."""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__()
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")

        self._client = None

    def _get_client(self):
        """Lazy initialization of Anthropic client."""
        if self._client is None:
            try:
                from anthropic import Anthropic
                self._client = Anthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError("anthropic package not installed. Run: pip install anthropic")
        return self._client

    async def _call_model(
        self,
        prompt: str,
        temperature: float = 0.0,
        max_tokens: int = 4096,
        json_mode: bool = True
    ) -> str:
        """Call Anthropic's Claude API."""
        client = self._get_client()

        system_prompt = "You are a medical data analyst. Always respond with valid JSON only, no markdown formatting."

        if json_mode:
            prompt = f"{prompt}\n\nIMPORTANT: Respond with valid JSON only."

        try:
            message = client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text if message.content else ""

            logger.debug(f"Anthropic response length: {len(response_text)}")
            return response_text

        except Exception as e:
            logger.error(f"Anthropic API error: {str(e)}", exc_info=False)
            raise Exception(f"Failed to call Anthropic API: {str(e)}")