import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.database import SessionLocal
from app.models.models import Category, MaterialType

def seed_categories():
    db = SessionLocal()
    try:
        existing = db.query(Category).count()
        if existing > 0:
            print(f"Categories already seeded ({existing} categories present).")
            return

        default_categories = [
            Category(name="Steel", material_type=MaterialType.REUSABLE, description="Structural steel, beams, rebars, and pipes suitable for reuse."),
            Category(name="Bricks", material_type=MaterialType.REUSABLE, description="Clay, fly ash, and concrete bricks for construction."),
            Category(name="Wood", material_type=MaterialType.REUSABLE, description="Timber beams, plywood panels, and scaffolding wood."),
            Category(name="Steel Scrap", material_type=MaterialType.RECYCLABLE, description="Metal scrap for industrial recycling."),
            Category(name="Concrete", material_type=MaterialType.RECYCLABLE, description="Crushed concrete and masonry waste for aggregate recycling."),
            Category(name="Wood Waste", material_type=MaterialType.RECYCLABLE, description="Unusable wood debris for biomass or chipping.")
        ]

        db.add_all(default_categories)
        db.commit()
        print(f"Successfully seeded {len(default_categories)} default categories.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding categories: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_categories()
