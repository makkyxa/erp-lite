# Query filters utilities
from typing import Any, Dict


def clean_filter_params(params: Dict[str, Any]) -> Dict[str, Any]:
    """Clean query filter parameters by removing None values and stripping whitespaces."""
    cleaned = {}
    for key, val in params.items():
        if val is not None:
            if isinstance(val, str):
                val = val.strip()
                if val == "":
                    continue
            cleaned[key] = val
    return cleaned
