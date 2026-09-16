from decimal import Decimal

from app.filing_audit import inline_facts


def test_independent_inline_values_units_scale_sign_nil_and_dimensions():
    html = """<xbrli:context id="annual"><xbrli:period><xbrli:startDate>2025-01-01</xbrli:startDate><xbrli:endDate>2025-12-31</xbrli:endDate></xbrli:period></xbrli:context>
    <xbrli:context id="instant"><xbrli:period><xbrli:instant>2025-12-31</xbrli:instant></xbrli:period></xbrli:context>
    <xbrli:context id="segment"><xbrli:entity><xbrli:segment><xbrldi:explicitMember>SegmentA</xbrldi:explicitMember></xbrli:segment></xbrli:entity></xbrli:context>
    <xbrli:unit id="usd"><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>
    <xbrli:unit id="eur"><xbrli:measure>iso4217:EUR</xbrli:measure></xbrli:unit>
    <ix:nonFraction name="us-gaap:Revenues" contextRef="annual" unitRef="usd" scale="6" format="ixt:num-dot-decimal">1,234</ix:nonFraction>
    <ix:nonFraction name="us-gaap:NetIncomeLoss" contextRef="annual" unitRef="usd" scale="3" sign="-">12.5</ix:nonFraction>
    <ix:nonFraction name="us-gaap:Cash" contextRef="instant" unitRef="usd" format="ixt:zerodash">—</ix:nonFraction>
    <ix:nonFraction name="us-gaap:Cash" contextRef="instant" unitRef="usd" xsi:nil="true">0</ix:nonFraction>
    <ix:nonFraction name="us-gaap:Revenues" contextRef="segment" unitRef="usd">999</ix:nonFraction>
    <ix:nonFraction name="us-gaap:Revenues" contextRef="annual" unitRef="eur">999</ix:nonFraction>
    <ix:nonFraction name="custom:Revenues" contextRef="annual" unitRef="usd">999</ix:nonFraction>"""
    facts = inline_facts(html)
    assert [fact["value"] for fact in facts] == [Decimal("1234000000"), Decimal("-12500"), Decimal("0")]
    assert facts[0]["start"] == "2025-01-01"
    assert facts[2]["start"] is None
    assert facts[2]["end"] == "2025-12-31"
