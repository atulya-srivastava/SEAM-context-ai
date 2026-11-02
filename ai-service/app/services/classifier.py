import time
import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np

from app.core.config import settings

logger = logging.getLogger("seam.classifier")

class IntentClassifierService:
    def __init__(self, model_dir: Path = settings.MODEL_DIR):
        self.model_dir = Path(model_dir)
        self.session = None
        self.tokenizer = None
        self.id2label = {0: "general", 1: "github", 2: "integration"}
        self._is_ready = False

    def load(self):
        """Loads ONNX inference session and tokenizer into memory."""
        if self._is_ready:
            return

        try:
            logger.info(f"Checking model directory at {self.model_dir}...")
            if not self.model_dir.exists():
                logger.warning(f"Model directory not found at {self.model_dir}. Using heuristic fallback.")
                return

            config_file = self.model_dir / "config.json"
            if config_file.exists():
                with open(config_file, "r") as f:
                    cfg = json.load(f)
                    if "id2label" in cfg:
                        self.id2label = {int(k): v for k, v in cfg["id2label"].items()}

            onnx_path = self.model_dir / "onnx" / "model_quantized.onnx"
            if not onnx_path.exists():
                onnx_path = self.model_dir / "onnx" / "model.onnx"
            if not onnx_path.exists():
                onnx_path = self.model_dir / "model.onnx"

            if not onnx_path.exists():
                logger.warning(f"ONNX model not found in {self.model_dir}. Using heuristic fallback.")
                return

            import onnxruntime as ort
            from transformers import AutoTokenizer

            logger.info(f"Loading ONNX runtime session: {onnx_path}")
            # Optimize for CPU execution with basic optimizations
            sess_options = ort.SessionOptions()
            sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
            sess_options.intra_op_num_threads = 2

            self.session = ort.InferenceSession(str(onnx_path), sess_options, providers=["CPUExecutionProvider"])
            self.tokenizer = AutoTokenizer.from_pretrained(str(self.model_dir), local_files_only=True)
            self._is_ready = True
            logger.info("IntentClassifierService loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load ONNX classifier: {e}. Falling back to rule-based classification.")
            self._is_ready = False

    def _softmax(self, logits: np.ndarray) -> np.ndarray:
        exp_logits = np.exp(logits - np.max(logits))
        return exp_logits / np.sum(exp_logits)

    def _heuristic_classify(self, text: str) -> Tuple[str, float, Dict[str, float]]:
        """Fallback classification when ML model is unavailable."""
        t = text.lower()
        gh_keywords = ["github", "repo", "commit", "branch", "pr", "pull request", "issue", "clone", "git", "octokit"]
        int_keywords = ["slack", "notion", "gmail", "email", "teams", "drive", "webhook", "discord", "integration", "sync"]

        gh_score = sum(1 for kw in gh_keywords if kw in t)
        int_score = sum(1 for kw in int_keywords if kw in t)

        if gh_score > 0 and gh_score >= int_score:
            return "github", 0.85, {"github": 0.85, "integration": 0.10, "general": 0.05}
        if int_score > 0:
            return "integration", 0.85, {"integration": 0.85, "github": 0.10, "general": 0.05}
        return "general", 0.90, {"general": 0.90, "github": 0.05, "integration": 0.05}

    def predict(self, text: str) -> Dict[str, Any]:
        start = time.perf_counter()

        if not self._is_ready or not self.session or not self.tokenizer:
            intent, conf, probs = self._heuristic_classify(text)
            elapsed_ms = (time.perf_counter() - start) * 1000
            return {
                "intent": intent,
                "confidence": round(conf, 4),
                "inference_ms": round(elapsed_ms, 2),
                "probabilities": probs,
                "engine": "heuristic_fallback",
            }

        inputs = self.tokenizer(
            text,
            return_tensors="np",
            truncation=True,
            max_length=128,
            padding=True,
        )

        onnx_inputs = {
            "input_ids": inputs["input_ids"].astype(np.int64),
            "attention_mask": inputs["attention_mask"].astype(np.int64),
        }

        outputs = self.session.run(None, onnx_inputs)
        logits = outputs[0][0]
        probs = self._softmax(logits)

        best_idx = int(np.argmax(probs))
        intent = self.id2label.get(best_idx, "general")
        confidence = float(probs[best_idx])

        elapsed_ms = (time.perf_counter() - start) * 1000
        prob_dict = {self.id2label.get(i, str(i)): round(float(p), 4) for i, p in enumerate(probs)}

        return {
            "intent": intent,
            "confidence": round(confidence, 4),
            "inference_ms": round(elapsed_ms, 2),
            "probabilities": prob_dict,
            "engine": "distilbert_onnx",
        }

classifier_service = IntentClassifierService()

