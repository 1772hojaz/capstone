import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
import db.database as database_module
from db.database import Base

from authentication.auth import create_access_token, hash_password
from models.models import User


@pytest.fixture(scope="session")
def test_db_path(tmp_path_factory):
    d = tmp_path_factory.mktemp("data")
    return str(d / "test.db")


@pytest.fixture(scope="session")
def engine(test_db_path):
    db_url = f"sqlite:///{test_db_path}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    return engine


@pytest.fixture(scope="session")
def tables(engine):
    # Create tables for tests
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(engine, tables):
    SessionTesting = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionTesting()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session, monkeypatch):
    # Override get_db dependency to use test session
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    monkeypatch.setattr(database_module, 'get_db', override_get_db)
    # Also ensure FastAPI dependency override uses the same function object
    app.dependency_overrides[database_module.get_db] = override_get_db

    with TestClient(app) as c:
        yield c


# Helper factory fixtures
@pytest.fixture()
def supplier_user(db_session):
    # Create a supplier user
    pwd = "TestPass123"
    user = User(
        email="supplier@example.test",
        hashed_password=hash_password(pwd),
        full_name="Supplier Test",
        location_zone="test_zone",
        is_supplier=True,
        is_admin=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def trader_user(db_session):
    pwd = "TraderPass123"
    user = User(
        email="trader@example.test",
        hashed_password=hash_password(pwd),
        full_name="Trader Test",
        location_zone="test_zone",
        is_supplier=False,
        is_admin=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def auth_header_supplier(supplier_user):
    token = create_access_token({"user_id": supplier_user.id, "email": supplier_user.email})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def auth_header_trader(trader_user):
    token = create_access_token({"user_id": trader_user.id, "email": trader_user.email})
    return {"Authorization": f"Bearer {token}"}
