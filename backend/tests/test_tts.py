import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services import tts


class TtsModuleTests(unittest.TestCase):
    def test_synthesize_speech_sync_returns_empty_bytes_for_blank_text(self):
        self.assertEqual(tts.synthesize_speech_sync("   ", "english"), b"")

    def test_normalize_language_accepts_nepali_variant(self):
        self.assertEqual(tts._normalize_language("ne-NP"), "nepali")


if __name__ == "__main__":
    unittest.main()
