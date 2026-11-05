import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.utils.security import hash_password, verify_password


def test_argon2_password_hash_verifies_without_storing_plaintext():
    password = "tree-tag-passphrase-2026"
    encoded = hash_password(password)

    assert encoded != password
    assert encoded.startswith("$argon2")
    assert verify_password(password, encoded)
    assert not verify_password("incorrect-password", encoded)
