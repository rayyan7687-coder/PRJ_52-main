import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.database import SessionLocal
from app.models.models import Category, MaterialType, User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings

def seed_db():
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not existing_admin:
            admin_user = User(
                name="System Admin",
                email=settings.ADMIN_EMAIL.lower(),
                phone="0000000000",
                password_hash=get_password_hash("AdminSecretPassword123!"),
                role=UserRole.ADMIN,
                is_verified=True,
                is_active=True
            )
            db.add(admin_user)
            print(f"Created default admin user: {settings.ADMIN_EMAIL}")

        existing = db.query(Category).count()
        if existing == 0:
            default_categories = [
                Category(name="Steel", material_type=MaterialType.REUSABLE, description="Structural steel, beams, rebars, and pipes suitable for reuse."),
                Category(name="Bricks", material_type=MaterialType.REUSABLE, description="Clay, fly ash, and concrete bricks for construction."),
                Category(name="Wood", material_type=MaterialType.REUSABLE, description="Timber beams, plywood panels, and scaffolding wood."),
                Category(name="Steel Scrap", material_type=MaterialType.RECYCLABLE, description="Metal scrap for industrial recycling."),
                Category(name="Concrete", material_type=MaterialType.RECYCLABLE, description="Crushed concrete and masonry waste for aggregate recycling."),
                Category(name="Wood Waste", material_type=MaterialType.RECYCLABLE, description="Unusable wood debris for biomass or chipping.")
            ]
            db.add_all(default_categories)
            print(f"Successfully seeded {len(default_categories)} default categories.")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
