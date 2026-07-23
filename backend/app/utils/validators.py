import re
from app.core.exceptions import BusinessLogicException

PHONE_REGEX = re.compile(r"^\+?[1-9]\d{1,14}$")

def validate_phone_number(phone: str) -> str:
    cleaned = re.sub(r"[\s\-\(\)]", "", phone)
    if not PHONE_REGEX.match(cleaned):
        raise BusinessLogicException(
            detail="Invalid phone number format. Must be in international format (e.g. +79991112233)"
        )
    return cleaned

def validate_vin(vin: str) -> str:
    cleaned = vin.strip().upper()
    if len(cleaned) != 17:
        raise BusinessLogicException(detail="VIN code must be exactly 17 characters long")
    if not cleaned.isalnum():
        raise BusinessLogicException(detail="VIN code must contain only alphanumeric characters")
    return cleaned
