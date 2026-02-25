"""
Scraper for Victoria Park / Brisbane 2032 Olympic Stadium articles.
Outputs a .txt dump and/or a .json file suitable for the Stumped sources input.

Requirements:
    pip install requests beautifulsoup4
"""

import json
import time
import requests
from bs4 import BeautifulSoup

URLS = [
    ("CNN - Stadium plans ignite debate", "https://www.cnn.com/2026/01/07/style/australia-brisbane-olympic-stadium-victoria-park-hnk-intl"),
    ("Wikipedia - Brisbane Olympic Stadium", "https://en.wikipedia.org/wiki/Brisbane_Olympic_Stadium"),
    ("Wikipedia - Victoria Park Brisbane", "https://en.wikipedia.org/wiki/Victoria_Park,_Brisbane"),
    ("Queensland Government - Delivering 2032 Venues", "https://www.delivering2032.com.au/legacy-for-queensland/venues"),
    ("GIICA - Brisbane Stadium", "https://giica.au/venues/brisbane-stadium"),
    ("Save Victoria Park - Home", "https://www.savevictoriapark.com/"),
    ("Save Victoria Park - Stadium Renders Mislead Public", "https://www.savevictoriapark.com/stadium-renders"),
    ("Save Victoria Park - Myth: Stadium Only Takes Tiny Part of Park", "https://www.savevictoriapark.com/myth-a-stadium-would-only-take-up-a-small-part-of-the-park"),
    ("Save Victoria Park - Myth: Nobody Uses Victoria Park", "https://www.savevictoriapark.com/myth-nobody-uses-victoria-park-currently"),
    ("Save Victoria Park - News Release: Environmentally Destructive Games", "https://www.savevictoriapark.com/resources/news-release-fake-artist-impressions"),
    ("Save Victoria Park - ATSIHP Application (Aunty Sandra)", "https://www.savevictoriapark.com/atsihp-1"),
    ("Save Victoria Park - Guardian Article Repost (Oct 2025)", "https://www.savevictoriapark.com/resources/theguardian-october-2025"),
    ("NIT - Queensland reveals designs amid ongoing opposition", "https://nit.com.au/05-01-2026/21995/queensland-reveals-victoria-park-olympic-stadium-designs-amid-ongoing-opposition"),
    ("Architecture AU - New stadium and venues announced", "https://architectureau.com/articles/new-stadium-and-venues-announced-for-brisbanes-2032-olympic-games/"),
    ("Architecture AU - EOI open for Victoria Park precinct", "https://architectureau.com/articles/brisbane-olympic-eoi-open-for-victoria-park-stadium-precinct/"),
    ("Architecture AU - Legal proceedings seek protection", "https://architectureau.com/articles/legal-proceedings-seek-protection-of-victoria-park-from-olympic-development/"),
    ("Architecture AU - Architects appointed", "https://architectureau.com/articles/architects-appointed-to-deliver-brisbanes-victoria-park-stadium-ahead-of-2032-games/"),
    ("Architecture AU - Cox and Hassell appointed", "https://architectureau.com/articles/cox-and-hassell-to-deliver-brisbanes-victoria-park-stadium/"),
    ("SBS News - Victoria Park to be 2032 stadium location", "https://www.sbs.com.au/news/article/victoria-park-to-be-the-2032-brisbane-olympics-stadium-location/dvuapterb"),
    ("SBS NITV - First Nations group launches bid to protect site", "https://www.sbs.com.au/nitv/article/first-nations-group-launches-bid-to-protect-site-from-olympic-stadium-plan/wmvfnsckh"),
    ("StadiumDB - Dispute over the stadium, new project unveiled", "https://stadiumdb.com/news/2026/01/australia_dispute_over_the_stadium_for_2032_olympic_games_new_project_unveiled_in_brisbane"),
    ("StadiumDB - Aboriginal group fights to save Victoria Park", "https://stadiumdb.com/news/2025/08/australia_aboriginal_group_fights_to_save_victoria_park_from_olympic_stadium"),
    ("Brisbane Development - Designs revealed for 63,000 seat stadium", "https://brisbanedevelopment.com.au/designs-revealed-for-brisbanes-63000-seat-olympic-stadium-at-victoria-park/"),
    ("Ministry of Sport - How the latest venue plan weighs up", "https://ministryofsport.com/brisbane-2032-how-the-latest-venue-plan-weighs-up/"),
    ("Arcadis - Balancing Cost and Legacy", "https://www.arcadis.com/en-au/insights/blog/australia/paul-allan/2024/balancing-cost-and-legacy-shaping-brisbanes-olympic-venue-future"),
    ("Queensland Government - 2032 Games Infrastructure Funding Deal Confirmed", "https://statements.qld.gov.au/statements/102978"),
    ("Queensland Government - EOI open for Victoria Park precinct", "https://statements.qld.gov.au/statements/103152"),
    ("Queensland Government - Delivering 2032 and Beyond media statement", "https://statements.qld.gov.au/statements/102240"),
    ("The Brisbane Olympics - Victoria Park stadium announced", "https://www.thebrisbaneolympics.com.au/victoria-park-stadium-announced-for-brisbane-2032-olympics/"),
    ("Inside the Games - Aboriginal group challenges Brisbane stadium", "https://www.insidethegames.biz/articles/1154532/aboriginal-group-stop-brisbane-stadium"),
    ("Inside the Games - Controversies cloud Queensland arena designs", "https://www.insidethegames.biz/articles/1156423/queensland-designs-politics"),
    ("The Stadium Business - First Nations legal challenge", "https://www.thestadiumbusiness.com/2025/08/05/first-nations-group-launches-legal-challenge-against-brisbane-2032-stadium/"),
    ("The Stadium Business - Arcadis sets out case for Victoria Park", "https://www.thestadiumbusiness.com/2024/12/06/victoria-park-plans-set-out-for-brisbane-2032/"),
    ("The Fifth Estate - Bedazzlement opinion piece", "https://thefifthestate.com.au/columns/spinifex/brisbanes-promise-of-a-shimmery-new-olympic-stadium-is-part-of-a-long-bedazzling-legacy-of-promises-gone-wrong/"),
    ("Jonathan Sri - Court challenges alone won't save Barrambin", "https://www.jonathansri.com/radicalbarrambin/"),
    ("Aussie Animals - Victoria Park Olympic Stadium Battle", "https://aussieanimals.com/conservation/community/victoria-park-olympic-stadium/"),
    ("Indie Daily QLD - Campaigners claim park's 150th birthday may be its last", "https://www.indailyqld.com.au/news/just-in/2025/11/12/campaigners-claim-victoria-parks-150th-birthday-may-be-its-last"),
    ("Village Voice - Stadiums set to destroy heritage-listed areas", "https://village-voice.com.au/stadiums-set-to-destroy-heritage-listed-areas-of-victoria-park/"),
    ("Infrastructure Magazine - Architects announced for new 2032 venue", "https://infrastructuremagazine.com.au/architects-announced-for-new-2032-olympic-venue-design"),
    ("Canadian Running - Facebook group stands in the way", "https://runningmagazine.ca/the-scene/facebook-group-stands-in-the-way-of-brisbanes-2032-olympic-stadium/"),
    ("Your Neighbourhood - Victoria Park Masterplan stadium idea", "https://yourneighbourhood.com.au/stadium-idea-victoria-park-masterplan-brisbane-2032-olympics/"),
    ("Your Neighbourhood - Queenslander design revealed", "https://yourneighbourhood.com.au/queenslander-design-for-victoria-park-stadium-brisbane-2032-olympic-venue/"),
    ("US News / Reuters - Indigenous group lodges application", "https://www.usnews.com/news/world/articles/2025-08-04/olympics-indigenous-group-lodges-application-for-federal-protection-of-brisbane-stadium-site"),
    ("Australasian Leisure Management - Backers revive Victoria Park plans", "https://www.ausleisure.com.au/news/new-brisbane-2032-games-venues-at-victoria-park-gets-key-backing/"),
    ("Brisbane Lions & Queensland Cricket welcome Victoria Park decision", "https://www.lions.com.au/news/1739937/brisbane-lions-and-queensland-cricket-welcome-victoria-park-decision"),
    ("AFL welcomes Victoria Park stadium decision", "https://www.afl.com.au/news/1286704/afl-welcomes-queensland-governments-victoria-park-stadium"),
    ("Play AFL - AFL welcomes Victoria Park stadium", "https://play.afl/news/afl-welcomes-queensland-governments-victoria-park-stadium"),
    ("Brisbane Heat - Stadium Plan Backed", "https://www.brisbaneheat.com.au/news/4238444/stadium-plan-backed"),
    ("ESPN - Lions and Queensland Cricket plea for new Brisbane stadium", "https://www.espn.com/afl/story/_/id/42264485/brisbane-lions-queensland-cricket-plea-new-brisbane-stadium"),
    ("Change.org - Victoria Park Stadium Let's Get It Done petition", "https://www.change.org/p/victoria-park-stadium-let-s-get-it-done"),
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}

TXT_OUTPUT = "victoria_park_stadium_text_dump.txt"
JSON_OUTPUT = "victoria_park_stadium_sources.json"
DELAY = 1.5  # seconds between requests


def fetch_text(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header",
                     "noscript", "aside", "iframe", "menu"]):
        tag.decompose()
    lines = [l.strip() for l in soup.get_text(separator="\n").splitlines() if l.strip()]
    return "\n".join(lines)


def main():
    json_entries = []

    with open(TXT_OUTPUT, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("VICTORIA PARK BRISBANE STADIUM / BRISBANE 2032 OLYMPICS\n")
        f.write("RAW TEXT DUMP FROM NEWS ARTICLES, ADVOCACY SITES, AND OFFICIAL SOURCES\n")
        f.write("=" * 80 + "\n\n")

        for label, url in URLS:
            print(f"Fetching: {label} ...")
            f.write("-" * 80 + "\n")
            f.write(f"SOURCE: {label}\n")
            f.write(f"URL: {url}\n")
            f.write("-" * 80 + "\n")
            try:
                text = fetch_text(url)
                f.write(text + "\n\n")
                json_entries.append({"url": url, "text": text})
                print(f"  OK ({len(text):,} chars)")
            except Exception as e:
                f.write(f"[ERROR fetching page: {e}]\n\n")
                print(f"  FAILED: {e}")
            time.sleep(DELAY)

    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(json_entries, f, ensure_ascii=False, indent=2)

    print(f"\nDone.")
    print(f"  TXT → {TXT_OUTPUT}")
    print(f"  JSON → {JSON_OUTPUT} ({len(json_entries)} entries)")


if __name__ == "__main__":
    main()
