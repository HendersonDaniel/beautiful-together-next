import unittest
from unittest.mock import MagicMock
from shelterluv import fetch_animals, normalize_animal, sync_animals, get_credentials


class ScraperTests(unittest.TestCase):
    def test_missing_or_blank_credentials_name_missing_settings(self):
        for env in ({}, {"NEXT_PUBLIC_SUPABASE_URL": " "}):
            with self.assertRaisesRegex(ValueError, "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"):
                get_credentials(env)

    def test_missing_url_does_not_expose_key(self):
        with self.assertRaisesRegex(ValueError, "NEXT_PUBLIC_SUPABASE_URL") as error:
            get_credentials({"NEXT_PUBLIC_SUPABASE_ANON_KEY": "test-key"})
        self.assertNotIn("test-key", str(error.exception))

    def test_existing_credentials_are_supported(self):
        self.assertEqual(get_credentials({"NEXT_PUBLIC_SUPABASE_URL": " https://example.supabase.co ",
                                          "NEXT_PUBLIC_SUPABASE_ANON_KEY": "test-secret-key"}),
                         ["https://example.supabase.co", "test-secret-key"])


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

    def test_upstream_failure_aborts_fetch(self):
        session = MagicMock()
        session.get.return_value.raise_for_status.side_effect = RuntimeError("503")
        with self.assertRaises(RuntimeError):
            fetch_animals("dog", session)


if __name__ == "__main__":
    unittest.main()
