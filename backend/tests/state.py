# Singleton de Estado para compartir datos entre tests
class TestState:
    superadmin_token: str = None
    dependency_id: str = None
    department_id: str = None
    official_email: str = None
    official_password: str = None
    official_token: str = None
    citizen_token: str = None
    citizen_id: str = None
    request_id: str = None
    last_folio: str = None
    program_id: str = None

state = TestState()