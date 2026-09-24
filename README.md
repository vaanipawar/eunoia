# Eunoia

Eunoia is a student well-being platform that helps universities notice burnout early. Students complete a short weekly check-in and can talk to a supportive chat assistant. When a conversation shows high stress, Eunoia writes a summary and hands the student to a human mentor. Admins get a view of risk across departments.

> **Eunoia is not a medical or crisis service.** The risk score is a screening aid, not a diagnosis, and the chat assistant does not replace a counsellor. Crisis helplines are shown inside the chat.

## Features

**Students**
- Weekly check-in: ten quick sliders covering attendance, assignments, grades, sleep, activity, stress and more
- A burnout risk score (0–100%) with a plain-language summary and a trend over recent weeks
- A private chat with Eunoia, plus past sessions and crisis helpline numbers

**Mentors**
- A list of assigned students, each with a briefing written from the student's chat: topics, stress level, risk flags and a recommended action
- Private notes, and one-click *Resolve* or *Escalate*
- New mentor accounts need admin approval before they can sign in

**Admins**
- Risk overview by department, a filterable student list and per-student chat history
- Mentor list and approval queue
- A button to run the weekly predictions on demand

## How it works

1. **Scoring.** A check-in is scored by an XGBoost model. Scores under 35% are *low*, 35–64% *medium*, and 65% and above *high*.
2. **Chat.** Each message is scored for stress with VADER sentiment analysis. If stress rises, the assistant switches from a supportive conversation to a short intake. The replies come from an LLM through [OpenRouter](https://openrouter.ai).
3. **Handoff.** When the intake finishes, the conversation is summarised into a mentor briefing. The student is assigned to the active mentor with the fewest open cases, and that mentor is emailed.
4. **Weekly job.** A Celery Beat task runs every Monday at 08:00 UTC, predicts for all students and emails those at high risk.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Recharts, Lucide icons |
| Backend | FastAPI, SQLAlchemy, Pydantic Settings, JWT auth (python-jose, passlib/bcrypt) |
| Machine learning | scikit-learn, XGBoost, pandas, VADER sentiment |
| Data and jobs | PostgreSQL 15, Redis 7, Celery (worker and beat) |
| Email | SendGrid |
| Chat model | OpenRouter (currently `openai/gpt-4o-mini`) |
| Runtime | Docker and Docker Compose |

## Project structure

```
Eunoia/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── core/        # settings, auth, database, Celery app
│   │   ├── models/      # SQLAlchemy models
│   │   ├── routes/      # auth, prediction, chat, mentor, admin
│   │   ├── services/    # chatbot, sentiment, mentor assignment, email
│   │   ├── tasks/       # weekly prediction job
│   │   └── ml/          # training script, predictor, saved model
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/       # one file per screen
        ├── components/  # layout, logo, risk badge
        ├── api/         # axios client and endpoints
        └── store/       # auth context
```

## Getting started

**You need:** [Docker Desktop](https://www.docker.com/products/docker-desktop/), plus an [OpenRouter](https://openrouter.ai/keys) API key.

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Eunoia
   ```

2. **Create your environment file**
   ```bash
   cp backend/.env.example backend/.env
   ```
   On Windows PowerShell, use `copy backend\.env.example backend\.env`.

3. **Fill in `backend/.env`**
   - `SECRET_KEY`: generate one with
     ```bash
     python -c "import secrets; print(secrets.token_urlsafe(48))"
     ```
     The backend will not start with a missing or short key.
   - `OPENROUTER_API_KEY`: your key from openrouter.ai.
   - `DATABASE_URL`: replace `CHANGE_ME` with the value of `POSTGRES_PASSWORD` in `docker-compose.yml`.
   - `SENDGRID_API_KEY` is optional for local use. Without it, password-reset and alert emails are not sent.

4. **Start everything**
   ```bash
   docker-compose up --build
   ```

5. **Open the app**
   - App: http://localhost:5173
   - API documentation: http://localhost:8000/docs

Register a student account from the sign-in screen and take a check-in to see the dashboard.

### Create the first admin

Admin accounts can't be self-registered, so the first one is created by promoting an existing account. Register normally, then run:

```bash
docker-compose exec postgres psql -U eunoia_user -d eunoia \
  -c "UPDATE users SET role = 'admin' WHERE email = 'you@example.com';"
```

Sign out and back in. From then on, admins can create other accounts through the API.

Mentors register from the same screen. Their accounts stay inactive until an admin approves them from the **Pending** tab.

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (Celery broker and result store) |
| `SECRET_KEY` | Signs login tokens. At least 32 characters, required |
| `OPENROUTER_API_KEY` | Access to the chat model |
| `SENDGRID_API_KEY` | Sending email (optional locally) |
| `FROM_EMAIL` | Sender address for emails |

Never commit `backend/.env`. It is listed in `.gitignore`.

## Retraining the model

The trained model is stored in `backend/app/ml/artifacts/`. To regenerate it, install the backend requirements and run this from the **project root**:

```bash
python backend/app/ml/train_model.py
```

It trains on generated data, prints precision, recall, ROC-AUC and feature importance, and saves the new model.

## API overview

All routes are under `/api` and documented interactively at `/docs`.

| Prefix | What it covers |
|---|---|
| `/api/auth` | Register, sign in, forgot and reset password, admin user creation |
| `/api/predict` | Submit a check-in, read your history |
| `/api/chat` | Send a message, list sessions, read a session |
| `/api/mentor` | Profile, assigned students, update notes and status |
| `/api/admin` | Students, mentors, approvals, student history, run predictions |

## Known limitations

This is a working prototype, and these are the gaps to close before real use:

- **The model is trained on synthetic data.** The training set is generated from a weighted formula, so the scores show how the system works but are not validated against real student outcomes.
- **The weekly job uses placeholder inputs.** It currently feeds every student the same default values instead of real academic records, so meaningful scores come from students' own check-ins.
- **Hard-coded local addresses.** The frontend calls `http://localhost:8000`, and email links point to `http://localhost:5173`. Both need to become configuration before deploying.
- **CORS is open to all origins,** and the Docker setup runs development servers. Tighten both for production.
- **Tables are created on startup** instead of through migrations, even though Alembic is installed.
- **There are no automated tests.** `backend/test_chat.py` is a manual script for trying the chatbot.

## Contributing

Issues and pull requests are welcome. Please don't include real API keys, student data or `.env` files in anything you share.

## License

No license has been chosen yet. Add a `LICENSE` file to state how others may use this code.
