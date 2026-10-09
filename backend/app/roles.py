"""NetraX RBAC role constants."""

from typing import Final

ROLE_OPERATOR: Final = "Screening Operator"
ROLE_OPHTHALMOLOGIST: Final = "Ophthalmologist"
ROLE_REVIEWER: Final = "Reviewer"
ROLE_ADMIN: Final = "Administrator"

ALL_ROLES: Final[tuple[str, ...]] = (
    ROLE_OPERATOR,
    ROLE_OPHTHALMOLOGIST,
    ROLE_REVIEWER,
    ROLE_ADMIN,
)

# Self-signup always gets this role
DEFAULT_REGISTER_ROLE: Final = ROLE_OPERATOR
