"""Sync the shelter's public Shelterluv listings into Available Animals.

Use --dry-run to inspect data without Supabase credentials or database writes.
"""
import argparse
import json
import os
import re
from urllib.parse import urljoin, urlparse

import requests

SITE = "https://beautifultogethersanctuary.com"
TABLE = "Available Animals"


def normalize_animal(animal, kind, source):
    if animal.get("species", "").lower() != kind:
        raise ValueError("Unexpected species in Shelterluv response")
    link = animal.get("public_url")
    if not link or not animal.get("name"):
        raise ValueError("Animal is missing its public URL or name")
    photos = animal.get("photos") or []
    if isinstance(photos, dict):
        photos = list(photos.values())
    photos = sorted(photos, key=lambda p: (not p.get("isCover"), p.get("order_column") or 0))
    images = []
    for photo in photos:
        url = urljoin(source, photo.get("url") or "")
        if photo.get("url") and urlparse(url).scheme in ("http", "https") and url not in images:
            images.append(url)
    tags = {
        "Breed": ", ".join(filter(None, [animal.get("breed"), animal.get("secondary_breed")])),
        "Gender": animal.get("sex"),
        "Color": ", ".join(filter(None, [animal.get("primary_color"), animal.get("secondary_color")])),
        "Age": (animal.get("age_group") or {}).get("name_with_duration"),
    }
    return {
        "name": animal["name"], "link": urljoin(source, link),
        "images": images, "tags": {k: v for k, v in tags.items() if v},
        "dog/cat": kind,
    }


def fetch_animals(kind, session=None):
    session = session or requests.Session()
    response = session.get(f"{SITE}/available-{kind}s/", timeout=30)
    response.raise_for_status()
    gid = re.search(r"\bvar\s+GID\s*=\s*(\d+)", response.text)
    domain = re.search(r'\bvar\s+sourceDomain\s*=\s*[\"\'](https://[^\"\']+)', response.text)
    if not gid or not domain:
        raise ValueError("Shelterluv embed was not found; database left unchanged")
    source = domain.group(1)
    response = session.get(f"{source}/api/v3/available-animals/{gid.group(1)}", params={"animalType": kind.title()}, timeout=30)
    response.raise_for_status()
    animals = response.json().get("animals")
    if not isinstance(animals, list) or not animals:
        raise ValueError("Empty or invalid listing; refusing to remove existing animals")
    records = [normalize_animal(animal, kind, source) for animal in animals]
    if len({r["link"] for r in records}) != len(records):
        raise ValueError("Duplicate animal links in listing")
    return records


def sync_animals(client, animals, kind):
    if not animals or any(a["dog/cat"] != kind for a in animals):
        raise ValueError("Refusing to sync empty or mixed-species data")
    # Read all species and filter in Python: PostgREST/client versions disagree
    # about escaping the slash in the legacy column name. Pagination avoids
    # silently ignoring records beyond the API's configured row limit.
    existing = []
    offset = 0
    while True:
        page = client.table(TABLE).select("*").order("id").range(offset, offset + 499).execute().data
        if not isinstance(page, list):
            raise ValueError("Could not read existing animals")
        if not page:
            break
        for row in page:
            if not {"id", "link", "dog/cat"}.issubset(row):
                raise ValueError("Available Animals must contain id, link, and dog/cat columns")
            if row["dog/cat"] == kind:
                existing.append(row)
        offset += len(page)
    by_link = {row["link"]: row for row in existing}
    for animal in animals:
        old = by_link.get(animal["link"])
        if old is None:
            client.table(TABLE).insert({**animal, "description": ""}).execute()
        elif any(old.get(key) != value for key, value in animal.items()):
            # Include images in change detection, preserving the existing row ID.
            client.table(TABLE).update(animal).eq("id", old["id"]).execute()
    current_links = {animal["link"] for animal in animals}
    for old in existing:
        if old["link"] not in current_links:
            client.table(TABLE).delete().eq("id", old["id"]).execute()



def get_credentials(environ=None):
    environ = os.environ if environ is None else environ
    names = ("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY")
    values = [environ.get(name, "").strip() for name in names]
    missing = [name for name, value in zip(names, values) if not value]
    if missing:
        raise ValueError(
            "Missing scraper configuration: " + ", ".join(missing)
            + ". Set these in GitHub Actions repository secrets (or .env.local for local runs). "
        )
    return values


def main(kind):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if not args.dry_run:
        from dotenv import load_dotenv
        load_dotenv(".env.local")
        try:
            url, key = get_credentials()
        except ValueError as error:
            parser.exit(1, f"{error}\n")
    animals = fetch_animals(kind)
    if args.dry_run:
        print(json.dumps(animals, indent=2))
        return
    from supabase import create_client
    client = create_client(url, key)
    sync_animals(client, animals, kind)
    print(f"Synced {len(animals)} {kind}s")
