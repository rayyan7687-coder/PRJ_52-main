import pytest
from app.utils.distance import calculate_haversine_distance
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db
from app.models.models import Category, MaterialType

def test_haversine_distance():
    lat1, lon1 = 12.9716, 77.5946
    lat2, lon2 = 12.9698, 77.7500
    dist = calculate_haversine_distance(lat1, lon1, lat2, lon2)
    assert 15.0 < dist < 20.0

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_search.db"
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

def test_nearby_search(client):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Seller 1", "email": "seller@example.com", "password": "password", "role": "SELLER"}
    )
    token = client.post("/api/v1/auth/login", json={"email": "seller@example.com", "password": "password"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/v1/listings",
        headers=headers,
        json={
            "title": "Nearby Steel Beams",
            "category_id": 1,
            "quantity": 500,
            "unit": "kg",
            "price": 30.0,
            "latitude": 12.9800,
            "longitude": 77.6000
        }
    )

    res = client.get("/api/v1/search/nearby?latitude=12.9716&longitude=77.5946&radius=10")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["title"] == "Nearby Steel Beams"
    assert items[0]["distance_km"] is not None
    assert items[0]["distance_km"] < 5.0
