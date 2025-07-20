# 🧭 HOWTO: Web Content Assistant Automation

This guide provides step-by-step instructions for using either the GitHub version or the ZIP archive of this automation project.

---

## 🧱 Option 1: Use the GitHub Repo

### ✅ Setup Instructions

```bash
git clone https://github.com/your-org/web-content-assistant-automation.git
cd web-content-assistant-automation
cp .env.example .env
pip install -r requirements.txt
```

### ▶️ Run Orchestration

```bash
python orchestrator/orchestrator.py
```

> 📌 This will sequentially run all modules and simulate updates, triage, reviews, and more.

---

## 📦 Option 2: Use the ZIP Archive

### ✅ Setup Steps

1. Unzip `web-content-assistant-automation.zip`
2. Open Terminal and navigate to the unzipped folder
3. Run:

```bash
cp .env.example .env
pip install -r requirements.txt
python orchestrator/orchestrator.py
```

> ⚠️ If `pip install` fails, try:

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

---

## 🔑 API Key Reminder

Edit `.env` file and insert your OpenAI key:
```env
OPENAI_API_KEY=sk-...
```

---

## 🗂️ File Structure Reference

- `modules/`: All automation task scripts
- `orchestrator/`: Central controller for running the automation
- `examples/`: Sample data and test outputs
- `docs/`: Project background, costs, enhancements
- `.env.example`: Template for secrets
- `requirements.txt`: Python dependency list

---

This HOWTO is designed to stand alone and can be emailed, printed, or dropped directly into a GitHub repo.
