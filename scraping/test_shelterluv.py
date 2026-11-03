import unittest
from unittest.mock import MagicMock
from shelterluv import fetch_animals, normalize_animal, sync_animals


class ScraperTests(unittest.TestCase):
    def test_photos_accept_sparse_objects_and_cover_first(self):
        animal = {"name": "Cat", "species": "Cat", "public_url": "/embed/animal/CAT-1", "photos": {
            "2": {"url": "/second.jpg"}, "9": {"url": "/cover.jpg", "isCover": True},
            "10": {"url": "/cover.jpg"}, "11": {"url": "javascript:bad"},
        }}
        result = normalize_animal(animal, "cat", "https://new.shelterluv.com")
        self.assertEqual(result["images"], ["https://new.shelterluv.com/cover.jpg", "https://new.shelterluv.com/second.jpg"])

    def test_empty_feed_does_not_reach_database(self):
        client = MagicMock()
        with self.assertRaises(ValueError):
            sync_animals(client, [], "dog")
        client.table.assert_not_called()

    def test_photo_only_change_updates_existing_id(self):
        client = MagicMock()
        table = client.table.return_value
        old = {"id": 42, "name": "Dog", "link": "https://example.org/dog", "images": ["old.jpg"], "tags": {}, "dog/cat": "dog"}
        table.select.return_value.eq.return_value.execute.return_value.data = [old]
        new = {k: v for k, v in old.items() if k != "id"}
        new["images"] = ["new.jpg"]
        sync_animals(client, [new], "dog")
        table.update.assert_called_once_with(new)
        table.update.return_value.eq.assert_called_once_with("id", 42)
        table.delete.assert_not_called()

    def test_upstream_failure_aborts_fetch(self):
        session = MagicMock()
        session.get.return_value.raise_for_status.side_effect = RuntimeError("503")
        with self.assertRaises(RuntimeError):
            fetch_animals("dog", session)


if __name__ == "__main__":
    unittest.main()
