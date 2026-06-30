"""
Fine-tune DistilBERT for 3-class intent classification.
Classes: github, integration, general

Usage:
  pip install transformers torch datasets scikit-learn onnx onnxruntime optimum
  python train.py

Input:  classifier/dataset.csv  (text,label — no header)
Output: classifier/model/       (ONNX model + tokenizer)
"""

import os
import csv
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
from optimum.onnxruntime import ORTModelForSequenceClassification
from optimum.onnxruntime.configuration import AutoQuantizationConfig
import torch

# --- Config ---
MODEL_NAME = "distilbert-base-uncased"
LABELS = ["general", "github", "integration"]
LABEL2ID = {l: i for i, l in enumerate(LABELS)}
ID2LABEL = {i: l for i, l in enumerate(LABELS)}
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "model")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset.csv")

# --- Load dataset ---
print("📂 Loading dataset from", DATASET_PATH)
texts, labels = [], []
with open(DATASET_PATH, "r") as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) >= 2:
            text = row[0].strip().strip('"')
            label = row[1].strip().strip('"').lower()
            if label in LABEL2ID and text:
                texts.append(text)
                labels.append(LABEL2ID[label])

print(f"✅ Loaded {len(texts)} samples")
for label_name, label_id in LABEL2ID.items():
    count = labels.count(label_id)
    print(f"   {label_name}: {count}")

# --- Split ---
train_texts, test_texts, train_labels, test_labels = train_test_split(
    texts, labels, test_size=0.2, random_state=42, stratify=labels
)

# --- Tokenize ---
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)

train_dataset = Dataset.from_dict({"text": train_texts, "label": train_labels}).map(tokenize, batched=True)
test_dataset = Dataset.from_dict({"text": test_texts, "label": test_labels}).map(tokenize, batched=True)

# --- Train ---
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, num_labels=3, id2label=ID2LABEL, label2id=LABEL2ID
)

training_args = TrainingArguments(
    output_dir="./classifier/checkpoints",
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=5,
    weight_decay=0.01,
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    logging_steps=10,
)

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = (preds == labels).mean()
    return {"accuracy": acc}

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    compute_metrics=compute_metrics,
)

print("\n🚀 Training DistilBERT...")
trainer.train()

# --- Evaluate ---
print("\n📊 Evaluation:")
preds = trainer.predict(test_dataset)
pred_labels = np.argmax(preds.predictions, axis=-1)
print(classification_report(test_labels, pred_labels, target_names=LABELS))

# --- Save PyTorch model + tokenizer ---
os.makedirs(OUTPUT_DIR, exist_ok=True)
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

# --- Export to ONNX + quantize ---
print("\n📦 Exporting to ONNX + quantizing...")
ort_model = ORTModelForSequenceClassification.from_pretrained(OUTPUT_DIR, export=True)
qconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)
ort_model.save_pretrained(OUTPUT_DIR)

print(f"\n✅ Model saved to {OUTPUT_DIR}/")
print("Files:")
for f in os.listdir(OUTPUT_DIR):
    size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
    print(f"   {f} ({size // 1024} KB)")
