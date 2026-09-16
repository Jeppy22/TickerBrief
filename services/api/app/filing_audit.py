"""Independent inline-XBRL checks for release verification, not a data fallback."""

from decimal import Decimal, InvalidOperation

from bs4 import BeautifulSoup


def inline_facts(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    contexts = {}
    for context in soup.find_all(lambda tag: tag.name.lower().split(":")[-1] == "context"):
        # Dimensional values cannot verify consolidated companyfacts observations.
        if context.find(
            lambda tag: (
                tag.name.lower().split(":")[-1] in ("explicitmember", "typedmember", "segment", "scenario")
            )
        ):
            continue
        period = {}
        for element in context.find_all(True):
            name = element.name.lower().split(":")[-1]
            if name in ("startdate", "enddate", "instant"):
                period[name] = element.get_text(strip=True)
        contexts[context.get("id")] = period
    units = {}
    for unit in soup.find_all(lambda tag: tag.name.lower().split(":")[-1] == "unit"):
        measures = unit.find_all(lambda tag: tag.name.lower().split(":")[-1] == "measure")
        if len(measures) == 1:
            units[unit.get("id")] = measures[0].get_text(strip=True).split(":")[-1]
    result = []
    for tag in soup.find_all(lambda tag: tag.name.lower().split(":")[-1] == "nonfraction"):
        if tag.get("xsi:nil") in ("true", "1") or tag.get("nil") in ("true", "1"):
            continue
        name, context = tag.get("name", ""), contexts.get(tag.get("contextref"))
        unit = units.get(tag.get("unitref"))
        if not name.startswith("us-gaap:") or context is None or unit != "USD":
            continue
        format_name = tag.get("format", "").lower()
        # Do not guess unfamiliar transformation rules or comma-decimal locales.
        if format_name and not any(
            value in format_name
            for value in ("num-dot-decimal", "numdotdecimal", "zerodash", "numdash", "fixed-zero")
        ):
            continue
        raw = tag.get_text("", strip=True).replace(",", "").replace(" ", "").replace("\xa0", "")
        if raw in ("-", "—", "–") and any(value in format_name for value in ("zero", "dash")):
            raw = "0"
        try:
            value = Decimal(raw) * (Decimal(10) ** int(tag.get("scale", 0)))
            if tag.get("sign") == "-":
                value = -value
        except (InvalidOperation, ValueError):
            continue
        result.append(
            {
                "concept": name.split(":", 1)[1],
                "unit": unit,
                "value": value,
                "start": context.get("startdate"),
                "end": context.get("enddate", context.get("instant")),
                "excerpt": str(tag)[:500],
            }
        )
    return result
