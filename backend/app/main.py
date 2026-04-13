from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, prediction, chat, admin, mentor
from app.core.database import Base, engine

# Import all models so tables get created
from app.models import user, burnout, chat as chat_model, mentor as mentor_model
from app.models import password_reset, mentor_profile

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Eunoia API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(prediction.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(mentor.router)

@app.get("/health")
def health():
    return {"status": "ok"}