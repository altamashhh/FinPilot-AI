"""
Transaction Auto-Categorization Engine
=======================================
Keyword-based categorizer that maps transaction descriptions
to predefined spending categories using case-insensitive matching.
"""

# ── Category Rules ─────────────────────────────────────────────────
# Each key is a category name; value is a list of keywords.
# Matching is case-insensitive and checks if any keyword appears
# anywhere in the transaction description.

CATEGORY_RULES: dict[str, list[str]] = {
    "Food": [
        "swiggy", "zomato", "restaurant", "cafe", "pizza", "burger",
    ],
    "Travel": [
        "uber", "ola", "fuel", "petrol", "diesel", "metro",
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "reliance",
    ],
    "Bills": [
        "electricity", "water", "gas", "internet", "recharge",
    ],
    "Income": [
        "salary", "bonus", "freelance",
    ],
}

DEFAULT_CATEGORY = "Others"


def auto_categorize(description: str) -> str:
    """
    Detect the category of a transaction from its description.

    Scans the description (case-insensitive) against all keyword rules
    and returns the first matching category. If no rule matches,
    returns 'Others'.

    Args:
        description: The transaction description text.

    Returns:
        The detected category name (e.g. "Food", "Travel", "Others").
    """
    if not description:
        return DEFAULT_CATEGORY

    desc_lower = description.lower()

    for category, keywords in CATEGORY_RULES.items():
        for keyword in keywords:
            if keyword in desc_lower:
                return category

    return DEFAULT_CATEGORY
