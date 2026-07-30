"""Marketing ORM enum persistence — values vs names."""

from __future__ import annotations

from app.models.marketing import MarketingContactSubmission, MarketingFranchiseInquiry


def test_contact_subject_enum_persists_api_values_not_member_names() -> None:
    labels = list(MarketingContactSubmission.__table__.c.subject.type.enums)
    assert labels == [
        "general",
        "order-help",
        "franchise",
        "partnership",
        "legal-privacy",
    ]
    assert "order_help" not in labels
    assert "legal_privacy" not in labels


def test_investment_range_enum_persists_api_values_not_member_names() -> None:
    labels = list(MarketingFranchiseInquiry.__table__.c.investment_range.type.enums)
    assert labels == ["10-25", "25-50", "50-plus", "unsure"]
    assert "range_25_50" not in labels
