import os
from typing import List, Optional

ENABLE_GRAPHQL = os.getenv("ENABLE_GRAPHQL", "false").lower() == "true"

schema = None
app = None

try:
    if ENABLE_GRAPHQL:
        import strawberry  # type: ignore
        from strawberry.asgi import GraphQL  # type: ignore
        from sqlalchemy.orm import Session
        from db.database import get_db, SessionLocal
        from models.models import User, AdminGroup

        @strawberry.type
        class GUser:
            id: int
            email: str
            full_name: Optional[str]
            location_zone: Optional[str]

        @strawberry.type
        class GGroup:
            id: int
            name: str
            description: Optional[str]
            category: Optional[str]
            price: float
            participants: int

        def _get_db() -> Session:
            return SessionLocal()

        @strawberry.type
        class Query:
            users: List[GUser] = strawberry.field(resolver=lambda: [
                GUser(id=u.id, email=u.email, full_name=u.full_name, location_zone=u.location_zone)
                for u in _get_db().query(User).limit(50).all()
            ])

            groups: List[GGroup] = strawberry.field(resolver=lambda: [
                GGroup(
                    id=g.id,
                    name=g.name,
                    description=g.description,
                    category=g.category,
                    price=g.price,
                    participants=g.participants,
                )
                for g in _get_db().query(AdminGroup).limit(50).all()
            ])

        schema = strawberry.Schema(query=Query)
        app = GraphQL(schema)
except Exception:
    schema = None
    app = None
*** End Patch
```} ***!

