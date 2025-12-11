import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# ------------------------------------------------------------------------
# 1. Añadir el directorio raíz al path para poder importar 'app'
# ------------------------------------------------------------------------
sys.path.append(os.getcwd())

# 2. Importar la configuración y los modelos
from app.core.config import settings
from app.database import Base
# IMPORTANTE: Importar todos los modelos aquí para que Alembic los vea
from app.models import * 

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 3. Asignar los metadatos de tus modelos
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    # Usar la URL de settings, no la de alembic.ini
    url = str(settings.SQLALCHEMY_DATABASE_URI)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Sobrescribir la configuración con nuestra URL de variables de entorno
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = str(settings.SQLALCHEMY_DATABASE_URI)
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()