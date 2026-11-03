"""Exercise real Supabase/PostgREST serialization against an in-memory HTTP API."""
import json
import unittest

import httpx
from supabase import create_client, ClientOptions
from shelterluv import sync_animals


def pet(id, kind="dog", image="old.jpg"):
    return {"id": id, "name": f"Pet {id}", "link": f"https://example.org/{id}",
            "images": [image], "tags": {}, "description": "Keep this", "dog/cat": kind}


class SyncHTTPTests(unittest.TestCase):
    def client(self, rows, fail_insert=False):
        self.calls = []
        def handle(request):
            self.calls.append(request)
            self.assertEqual(request.url.path, "/rest/v1/Available Animals")
            self.assertNotIn("dog/cat", str(request.url))
            self.assertTrue(set(request.url.params.keys()) <= {"select", "order", "offset", "limit", "id"})
            if request.method == "GET":
                offset = int(request.url.params.get("offset", 0))
                # Simulate a server row limit lower than the client's page size.
                return httpx.Response(200, json=sorted(rows, key=lambda r: r["id"])[offset:offset+1])
            if request.method == "POST":
                if fail_insert:
                    return httpx.Response(403, json={"message": "write denied", "code": "42501"})
                body = json.loads(request.content)
                self.assertIsInstance(body, dict)
                self.assertIn("dog/cat", body)
                row = {"id": max([r["id"] for r in rows] + [0])+1, **body}
                rows.append(row)
                return httpx.Response(201, json=[row])
            row_id = int(request.url.params["id"].removeprefix("eq."))
            row = next(r for r in rows if r["id"] == row_id)
            if request.method == "PATCH":
                row.update(json.loads(request.content))
            elif request.method == "DELETE":
                rows.remove(row)
            else:
                self.fail(f"Unexpected method {request.method}")
            return httpx.Response(200, json=[row])
        http = httpx.Client(transport=httpx.MockTransport(handle))
        self.addCleanup(http.close)
        return create_client("https://example.supabase.co", "sb_publishable_test", options=ClientOptions(httpx_client=http))

    def test_complete_sync_and_repeat_for_each_species(self):
        for kind, other in (("dog", "cat"), ("cat", "dog")):
            rows = [pet(1, kind), pet(2, other), pet(3, kind)]
            client = self.client(rows)
            changed = {k: v for k, v in pet(1, kind, "new.jpg").items() if k not in ("id", "description")}
            new = {k: v for k, v in pet(4, kind).items() if k not in ("id", "description")}
            sync_animals(client, [changed, new], kind)
            self.assertEqual(len(rows), 3)
            self.assertIn(pet(2, other), rows)
            self.assertEqual(rows[0]["images"], ["new.jpg"])
            self.assertEqual(rows[0]["description"], "Keep this")
            self.assertFalse(any(r["id"] == 3 for r in rows))
            self.calls.clear()
            sync_animals(client, [changed, new], kind)
            self.assertTrue(all(r.method == "GET" for r in self.calls))

    def test_empty_database_accepts_insert(self):
        rows = []
        client = self.client(rows)
        new = {k: v for k, v in pet(1).items() if k not in ("id", "description")}
        sync_animals(client, [new], "dog")
        self.assertEqual(rows[0]["dog/cat"], "dog")

    def test_write_failure_prevents_deletion(self):
        rows = [pet(1)]
        client = self.client(rows, fail_insert=True)
        new = {k: v for k, v in pet(2).items() if k not in ("id", "description")}
        with self.assertRaises(Exception):
            sync_animals(client, [new], "dog")
        self.assertEqual(rows, [pet(1)])
        self.assertFalse(any(r.method == "DELETE" for r in self.calls))
