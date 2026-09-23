import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.models.models import Category, MaterialType

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_listings.db"

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

def test_listing_lifecycle(client):
    seller_res = client.post(
        "/api/v1/auth/register",
        json={"name": "Seller 1", "email": "seller1@example.com", "password": "password", "role": "SELLER"}
    )
    seller_token = client.post("/api/v1/auth/login", json={"email": "seller1@example.com", "password": "password"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {seller_token}"}

    create_res = client.post(
        "/api/v1/listings",
        headers=headers,
        json={
            "title": "Used Steel Beams",
            "category_id": 1,
            "description": "Clean steel beams",
            "quantity": 1000,
            "unit": "kg",
            "condition": "GOOD",
            "grade": "B",
            "price": 45.0,
            "is_negotiable": True,
            "latitude": 12.9716,
            "longitude": 77.5946,
            "images": ["http://example.com/beam.jpg"]
        }
    )
    assert create_res.status_code == 201
    listing = create_res.json()
    assert listing["title"] == "Used Steel Beams"
    assert listing["status"] == "ACTIVE"
    assert len(listing["images"]) == 1

    listing_id = listing["id"]

    res_res = client.post(f"/api/v1/listings/{listing_id}/reserve", headers=headers)
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESERVED"

    sold_res = client.post(f"/api/v1/listings/{listing_id}/sold", headers=headers)
    assert sold_res.status_code == 200
    assert sold_res.json()["status"] == "SOLD"
    assert sold_res.json()["is_visible"] is False
