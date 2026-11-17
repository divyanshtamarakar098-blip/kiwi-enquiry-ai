from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLite database file path stored inside the backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./enquiries.db"

# connect_args={"check_same_thread": False} is required for SQLite in multithreaded FastAPI apps
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# SessionLocal class: each instance is a database session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all SQLAlchemy ORM models
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session per request
    and guarantees it closes once the request is complete.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

