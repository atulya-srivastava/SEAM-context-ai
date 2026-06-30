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
from sklearn.metrics import classification_report, f1_score
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding,
    EarlyStoppingCallback
)
from optimum.onnxruntime import ORTModelForSequenceClassification, ORTQuantizer
from optimum.onnxruntime.configuration import AutoQuantizationConfig

# --- Config ---
MODEL_NAME = "distilbert-base-uncased"
LABELS = ["general", "github", "integration"]
LABEL2ID = {l: i for i, l in enumerate(LABELS)}
ID2LABEL = {i: l for i, l in enumerate(LABELS)}
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "model")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset.csv")

# --- Load dataset ---
print("Loading dataset from", DATASET_PATH)
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

print(f"Loaded {len(texts)} samples")
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
    return tokenizer(examples["text"], truncation=True, max_length=128)

train_dataset = Dataset.from_dict({"text": train_texts, "label": train_labels}).map(tokenize, batched=True)
test_dataset = Dataset.from_dict({"text": test_texts, "label": test_labels}).map(tokenize, batched=True)

data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

# --- Train ---
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, num_labels=3, id2label=ID2LABEL, label2id=LABEL2ID
)

training_args = TrainingArguments(
    output_dir=os.path.join(os.path.dirname(__file__), "checkpoints"),
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=5,
    weight_decay=0.01,
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    logging_steps=10,
)

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = (preds == labels).mean()
    f1 = f1_score(labels, preds, average="weighted")
    return {"accuracy": acc, "f1": f1}

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    tokenizer=tokenizer,
    data_collator=data_collator,
    compute_metrics=compute_metrics,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
)

print("\nTraining DistilBERT...")
trainer.train()

# --- Evaluate ---
print("\n Evaluation:")
preds = trainer.predict(test_dataset)
pred_labels = np.argmax(preds.predictions, axis=-1)
print(classification_report(test_labels, pred_labels, target_names=LABELS))

# --- Save PyTorch model + tokenizer ---
os.makedirs(OUTPUT_DIR, exist_ok=True)
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

# --- Export to ONNX ---
print("\n Exporting to ONNX...")
ort_model = ORTModelForSequenceClassification.from_pretrained(OUTPUT_DIR, export=True)
onnx_dir = os.path.join(OUTPUT_DIR, "onnx")
os.makedirs(onnx_dir, exist_ok=True)

# Save unquantized model to onnx_dir
ort_model.save_pretrained(onnx_dir)

# --- Quantize ONNX model ---
print("\n Quantizing ONNX model...")
quantizer = ORTQuantizer.from_pretrained(ort_model)
qconfig = AutoQuantizationConfig.avx2(is_static=False, per_channel=False)
quantizer.quantize(save_dir=onnx_dir, quantization_config=qconfig)

# --- Cleanup ---
print("\n Cleaning up redundant files...")

# 1. Delete the unquantized ONNX model
unquantized_onnx = os.path.join(onnx_dir, "model.onnx")
if os.path.exists(unquantized_onnx):
    os.remove(unquantized_onnx)

# 2. Delete the PyTorch weights (safetensors)
safetensors_path = os.path.join(OUTPUT_DIR, "model.safetensors")
if os.path.exists(safetensors_path):
    os.remove(safetensors_path)

# 3. Clean up the training checkpoints directory
import shutil
checkpoints_dir = os.path.abspath(training_args.output_dir)
if os.path.exists(checkpoints_dir):
    shutil.rmtree(checkpoints_dir)

# 4. Remove duplicate configuration/tokenizer files created by Optimum inside the onnx folder.
# We keep only 'model_quantized.onnx' and 'ort_config.json' inside onnx/.
for filename in os.listdir(onnx_dir):
    if filename not in ["model_quantized.onnx", "ort_config.json"]:
        os.remove(os.path.join(onnx_dir, filename))

print(f"\n Model training, export, and cleanup completed successfully.")
print(f" Clean model files saved to {OUTPUT_DIR}/")
