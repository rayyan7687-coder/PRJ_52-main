import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"

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
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_register_and_login(client):
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Seller",
            "email": "seller@example.com",
            "password": "password123",
            "role": "SELLER",
            "latitude": 12.9716,
            "longitude": 77.5946
        }
    )
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert data["email"] == "seller@example.com"
    assert data["role"] == "SELLER"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "seller@example.com", "password": "password123"}
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data

    token = token_data["access_token"]
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["name"] == "Test Seller"

def test_admin_registration_restriction(client):
    # Registration with ADMIN role without secret key should fail
    fail_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Unauthorized Admin",
            "email": "badadmin@example.com",
            "password": "password123",
            "role": "ADMIN"
        }
    )
    assert fail_response.status_code == 403

    # Registration with ADMIN role with correct key should succeed
    success_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Authorized Admin",
            "email": "goodadmin@example.com",
            "password": "password123",
            "role": "ADMIN",
            "admin_key": "admin-secret-key-123"
        }
    )
    assert success_response.status_code == 201

def test_blocked_user_login(client):
    # Register user
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Blocked User",
            "email": "blocked@example.com",
            "password": "password123",
            "role": "CONTRACTOR_BUILDER"
        }
    )
    # Register admin
    admin_reg = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Admin",
            "email": "admin@example.com",
            "password": "password123",
            "role": "ADMIN",
            "admin_key": "admin-secret-key-123"
        }
    )
    admin_id = admin_reg.json()["id"]

    # Login as admin
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "password123"}
    )
    admin_token = admin_login.json()["access_token"]

    # Admin blocks user
    client.put(
        "/api/v1/admin/users/1/block",
        headers={"Authorization": f"Bearer {admin_token}"}
    )

    # Blocked user attempts login
    blocked_login = client.post(
        "/api/v1/auth/login",
        json={"email": "blocked@example.com", "password": "password123"}
    )
    assert blocked_login.status_code == 403
    assert "admin@buildloop.com" in blocked_login.json()["detail"]
