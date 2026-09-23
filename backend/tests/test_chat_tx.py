import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.models.models import Category, MaterialType

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_chat_tx.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.add(Category(name="Steel", material_type=MaterialType.REUSABLE, description="Structural steel"))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_chat_and_transaction(client):
    client.post("/api/v1/auth/register", json={"name": "Seller", "email": "s@example.com", "password": "password", "role": "SELLER"})
    s_token = client.post("/api/v1/auth/login", json={"email": "s@example.com", "password": "password"}).json()["access_token"]

    client.post("/api/v1/auth/register", json={"name": "Buyer", "email": "b@example.com", "password": "password", "role": "BUYER"})
    b_token = client.post("/api/v1/auth/login", json={"email": "b@example.com", "password": "password"}).json()["access_token"]

    listing_res = client.post(
        "/api/v1/listings",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"title": "Steel Beams", "category_id": 1, "quantity": 100, "unit": "kg", "price": 50.0, "latitude": 10.0, "longitude": 10.0}
    )
    listing_id = listing_res.json()["id"]

    conv_res = client.post(
        "/api/v1/conversations",
        headers={"Authorization": f"Bearer {b_token}"},
        json={"listing_id": listing_id}
    )
    assert conv_res.status_code == 201
    conv_id = conv_res.json()["id"]

    msg_res = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {b_token}"},
        json={"message": "Is this available?"}
    )
    assert msg_res.status_code == 201

    tx_res = client.post(
        "/api/v1/transactions",
        headers={"Authorization": f"Bearer {b_token}"},
        json={"listing_id": listing_id, "agreed_price": 45.0}
    )
    assert tx_res.status_code == 201
    tx_id = tx_res.json()["id"]

    complete_res = client.put(
        f"/api/v1/transactions/{tx_id}",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"status": "COMPLETED"}
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "COMPLETED"
    assert complete_res.json()["listing"]["status"] == "SOLD"
