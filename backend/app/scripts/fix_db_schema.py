import sys
import os
from sqlalchemy import text

# Añadir el directorio raíz al path
sys.path.append(os.getcwd())

from app.database import engine

def fix_schema():
    print("🔧 Iniciando parche de base de datos...")
    try:
        with engine.connect() as connection:
            # 1. Cambiar la columna 'region' a TEXT (sin límite de longitud)
            print("   -> Alterando columna 'region' a TEXT...")
            connection.execute(text("ALTER TABLE system_alerts ALTER COLUMN region TYPE TEXT;"))
            
            # 2. Cambiar la columna 'message' a TEXT (por si acaso el título del patrón es largo)
            print("   -> Alterando columna 'message' a TEXT...")
            connection.execute(text("ALTER TABLE system_alerts ALTER COLUMN message TYPE TEXT;"))
            
            connection.commit()
            print("✅ Base de datos parcheada correctamente. Ahora soporta textos largos de IA.")
    except Exception as e:
        print(f"❌ Error al parchear: {e}")
        print("   (Si dice que la columna ya es text, ignora este error)")

if __name__ == "__main__":
    fix_schema()