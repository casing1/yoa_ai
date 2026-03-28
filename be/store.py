import hashlib
import secrets
from datetime import datetime, timezone

from supabase import create_client
from supabase.lib.client_options import SyncClientOptions


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class TokenStore:
    def __init__(self, supabase_url, service_role_key):
        if not supabase_url:
            raise ValueError("SUPABASE_URL is required")
        if not service_role_key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY is required")

        self.client = create_client(
            supabase_url,
            service_role_key,
            options=SyncClientOptions(
                auto_refresh_token=False,
                persist_session=False,
            ),
        )

    def _table(self):
        return self.client.table("tokens")

    def issue_token(self, plan="basic", label=None):
        raw_token = secrets.token_urlsafe(32)
        now = utc_now()
        token_hash = hash_token(raw_token)
        token_prefix = raw_token[:10]

        self._table().insert(
            {
                "token_hash": token_hash,
                "token_prefix": token_prefix,
                "plan": plan,
                "label": label,
                "status": "valid",
                "issued_at": now,
            }
        ).execute()

        return {
            "token": raw_token,
            "plan": plan,
            "label": label,
            "status": "valid",
            "issued_at": now,
        }

    def validate_token(self, raw_token, touch=True):
        token_hash = hash_token(raw_token)

        response = (
            self._table()
            .select("token_prefix, plan, label, status, issued_at, last_used_at, revoked_at")
            .eq("token_hash", token_hash)
            .maybe_single()
            .execute()
        )
        row = response.data

        if row is None:
            return {"valid": False, "reason": "not_found"}

        if row["status"] != "valid":
            return {
                "valid": False,
                "reason": row["status"],
                "plan": row["plan"],
                "label": row["label"],
            }

        if touch:
            last_used_at = utc_now()
            (
                self._table()
                .update({"last_used_at": last_used_at})
                .eq("token_hash", token_hash)
                .execute()
            )
        else:
            last_used_at = row["last_used_at"]

        return {
            "valid": True,
            "plan": row["plan"],
            "label": row["label"],
            "status": row["status"],
            "issued_at": row["issued_at"],
            "last_used_at": last_used_at,
            "token_prefix": row["token_prefix"],
        }

    def revoke_token(self, raw_token):
        token_hash = hash_token(raw_token)
        revoked_at = utc_now()

        response = (
            self._table()
            .select("status")
            .eq("token_hash", token_hash)
            .maybe_single()
            .execute()
        )
        row = response.data

        if row is None:
            return {"revoked": False, "reason": "not_found"}

        if row["status"] == "revoked":
            return {"revoked": True, "status": "revoked", "already_revoked": True}

        (
            self._table()
            .update({"status": "revoked", "revoked_at": revoked_at})
            .eq("token_hash", token_hash)
            .execute()
        )

        return {"revoked": True, "status": "revoked", "revoked_at": revoked_at}
