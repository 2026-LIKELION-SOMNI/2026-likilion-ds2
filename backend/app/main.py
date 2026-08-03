from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

# 앱 생성 시 DB 테이블 자동 생성 (models가 추가되면 자동 반영)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hackathon API",
    description="PostgreSQL + FastAPI 백엔드 API",
    version="0.1.0"
)

# 프론트엔드 연동용 CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FastAPI & PostgreSQL Server Ready!"}