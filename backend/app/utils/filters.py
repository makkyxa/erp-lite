from typing import Any, Dict

def clean_filter_params(params: Dict[str, Any]) -> Dict[str, Any]:
    cleaned = {}
    for key, val in params.items():
        if val is not None:
            if isinstance(val, str):
                val = val.strip()
                if val == "":
                    continue
            cleaned[key] = val
    return cleaned
