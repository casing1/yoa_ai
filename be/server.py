#!/usr/bin/env python3
import os
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from fastapi import Body, FastAPI, Header, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, Field

try:
    from .store import TokenStore
except ImportError:
    from store import TokenStore


LOYALTY_PHRASE = "나는 요약AI 없이는 단 하루도 살 수 없는 흑우입니다"
BACKDOOR_AUTH_CODE = "000000"


class HealthResponse(BaseModel):
    status: str = Field(examples=["ok"])
    service: str = Field(examples=["yoa-token-backend"])


class BasicClaimRequest(BaseModel):
    input_text: str = Field(description="CLI에서 토큰 채굴에 사용하던 원문 입력")
    label: str | None = Field(default=None, description="선택 라벨")


class ProClaimRequest(BaseModel):
    auth_code: str | None = Field(default=None, description="예능용 백도어 인증번호")
    loyalty_phrase: str | None = Field(default=None, description="충성 맹세 문장")
    label: str | None = Field(default=None, description="선택 라벨")


class ClaimedBasicTokenResponse(BaseModel):
    token: str
    plan: Literal["basic"]
    label: str | None = None
    status: Literal["valid"]
    issued_at: str
    claim_type: Literal["basic"]
    summary_result: str


class ClaimedProTokenResponse(BaseModel):
    token: str
    plan: Literal["pro"]
    label: str | None = None
    status: Literal["valid"]
    issued_at: str
    claim_type: Literal["pro"]
    claim_method: Literal["auth_code", "loyalty_phrase"]


class ClaimFailureResponse(BaseModel):
    issued: Literal[False]
    reason: str
    summary_result: str | None = None


class InvalidJsonResponse(BaseModel):
    error: Literal["invalid_json"]


class TokenRequest(BaseModel):
    token: str | None = Field(
        default=None,
        description="Raw token. Optional when using the Authorization header.",
    )


class TokenValidationSuccessResponse(BaseModel):
    valid: Literal[True]
    plan: str
    label: str | None = None
    status: str
    issued_at: str
    last_used_at: str | None = None
    token_prefix: str


class TokenValidationFailureResponse(BaseModel):
    valid: Literal[False]
    reason: str
    plan: str | None = None
    label: str | None = None


class RevokeSuccessResponse(BaseModel):
    revoked: Literal[True]
    status: str
    revoked_at: str | None = None
    already_revoked: bool | None = None


class RevokeFailureResponse(BaseModel):
    revoked: Literal[False]
    reason: str


def load_dotenv():
    candidate_paths = [
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent / ".env",
    ]

    for env_path in candidate_paths:
        if not env_path.exists():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("'\"")

            if key:
                os.environ.setdefault(key, value)
        return


def parse_bearer_token(header_value):
    if not header_value:
        return None

    prefix = "Bearer "
    if not header_value.startswith(prefix):
        return None

    token = header_value[len(prefix) :].strip()
    return token or None


def token_from_request(body, authorization):
    if body and body.token:
        return body.token
    return parse_bearer_token(authorization)


def summarize_candidate(input_text):
    if " " in input_text:
        return "".join(word[0] for word in input_text.split() if word)
    return "".join(input_text[index] for index in range(0, len(input_text), 3))


def evaluate_basic_claim(input_text):
    normalized = input_text.strip()
    if not normalized:
        return False, "empty_input", None
    if normalized == "토큰":
        return False, "cheat_input", None

    summary_result = summarize_candidate(normalized)
    if summary_result != "토큰":
        return False, "claim_not_satisfied", summary_result
    return True, None, summary_result


def evaluate_pro_claim(auth_code, loyalty_phrase):
    if auth_code == BACKDOOR_AUTH_CODE:
        return True, "auth_code"
    if loyalty_phrase == LOYALTY_PHRASE:
        return True, "loyalty_phrase"
    if auth_code is not None:
        return False, "invalid_auth_code"
    if loyalty_phrase is not None:
        return False, "invalid_loyalty_phrase"
    return False, "missing_claim_input"


load_dotenv()

HOST = os.environ.get("YOA_HOST", "127.0.0.1")
PORT = int(os.environ.get("YOA_PORT", "8080"))
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


@lru_cache(maxsize=1)
def get_store():
    return TokenStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def require_store():
    try:
        return get_store()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


app = FastAPI(
    title="yoa Backend",
    version="0.4.1",
    summary="Token claim and validation backend for yoa.",
    description=(
        "A FastAPI backend that turns the hidden CLI token rules into HTTP APIs. "
        "It issues basic and pro tokens, validates bearer access, and revokes tokens."
    ),
    contact={"name": "yoa Backend"},
    openapi_tags=[
        {"name": "meta", "description": "Service status and API entrypoints."},
        {"name": "claims", "description": "CLI-derived token claim endpoints."},
        {"name": "tokens", "description": "Token validation and revoke operations."},
    ],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": "invalid_json"},
    )


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        summary=app.summary,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
        contact=app.contact,
    )

    for path_item in openapi_schema.get("paths", {}).values():
        for operation in path_item.values():
            responses = operation.get("responses", {})
            responses.pop("422", None)

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/", include_in_schema=False)
async def docs_redirect():
    return RedirectResponse(url="/docs", status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@app.get(
    "/health",
    tags=["meta"],
    summary="Health check",
    response_model=HealthResponse,
)
async def health():
    return {"status": "ok", "service": "yoa-token-backend"}


@app.post(
    "/tokens/claim/basic",
    tags=["claims"],
    summary="Claim a basic token",
    description="Issues a basic token when the CLI abbreviation logic produces '토큰'.",
    response_model=ClaimedBasicTokenResponse,
    responses={400: {"model": ClaimFailureResponse, "description": "Claim condition not satisfied."}},
)
async def claim_basic_token(
    body: Annotated[
        BasicClaimRequest,
        Body(
            openapi_examples={
                "hidden_puzzle": {
                    "summary": "First-letter puzzle",
                    "value": {"input_text": "토마토 큰일났다", "label": "cli-basic"},
                }
            }
        ),
    ],
):
    allowed, reason, summary_result = evaluate_basic_claim(body.input_text)
    if not allowed:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"issued": False, "reason": reason, "summary_result": summary_result},
        )

    issued = require_store().issue_token(plan="basic", label=body.label)
    issued["claim_type"] = "basic"
    issued["summary_result"] = summary_result
    return JSONResponse(status_code=status.HTTP_201_CREATED, content=issued)


@app.post(
    "/tokens/claim/pro",
    tags=["claims"],
    summary="Claim a pro token",
    description="Issues a pro token with the hidden auth code or loyalty phrase from the CLI.",
    response_model=ClaimedProTokenResponse,
    responses={400: {"model": ClaimFailureResponse, "description": "Claim condition not satisfied."}},
)
async def claim_pro_token(
    body: Annotated[
        ProClaimRequest,
        Body(
            openapi_examples={
                "auth_code": {
                    "summary": "Backdoor auth code",
                    "value": {"auth_code": "000000", "label": "cli-pro-auth"},
                },
                "loyalty_phrase": {
                    "summary": "Loyalty phrase",
                    "value": {
                        "loyalty_phrase": LOYALTY_PHRASE,
                        "label": "cli-pro-loyalty",
                    },
                },
            }
        ),
    ],
):
    allowed, claim_method = evaluate_pro_claim(body.auth_code, body.loyalty_phrase)
    if not allowed:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"issued": False, "reason": claim_method},
        )

    issued = require_store().issue_token(plan="pro", label=body.label)
    issued["claim_type"] = "pro"
    issued["claim_method"] = claim_method
    return JSONResponse(status_code=status.HTTP_201_CREATED, content=issued)


@app.get(
    "/access",
    tags=["tokens"],
    summary="Validate access from a Bearer token",
    description="Validates a token from the Authorization header for frontend or server access checks.",
    response_model=TokenValidationSuccessResponse,
    responses={
        401: {
            "model": TokenValidationFailureResponse,
            "description": "Bearer token missing or invalid.",
        }
    },
)
async def access(
    authorization: Annotated[
        str | None,
        Header(description="Bearer token header. Example: `Bearer <token>`."),
    ] = None,
):
    token = parse_bearer_token(authorization)
    if not token:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"valid": False, "reason": "missing_bearer_token"},
        )

    result = require_store().validate_token(token)
    status_code = status.HTTP_200_OK if result["valid"] else status.HTTP_401_UNAUTHORIZED
    return JSONResponse(status_code=status_code, content=result)


@app.post(
    "/tokens/validate",
    tags=["tokens"],
    summary="Validate a token",
    description="Validates a token from the request body or from the Authorization header.",
    response_model=TokenValidationSuccessResponse,
    responses={
        400: {
            "model": TokenValidationFailureResponse,
            "description": "Token missing or invalid JSON payload.",
        },
        401: {
            "model": TokenValidationFailureResponse,
            "description": "Token not found or revoked.",
        },
    },
)
async def validate_token(
    body: Annotated[
        TokenRequest | None,
        Body(
            openapi_examples={
                "body": {
                    "summary": "Send token in the JSON body",
                    "value": {"token": "your-issued-token"},
                }
            }
        ),
    ] = None,
    authorization: Annotated[
        str | None,
        Header(description="Optional Bearer token header. Example: `Bearer <token>`."),
    ] = None,
):
    token = token_from_request(body, authorization)
    if not token:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"valid": False, "reason": "missing_token"},
        )

    result = require_store().validate_token(token)
    status_code = status.HTTP_200_OK if result["valid"] else status.HTTP_401_UNAUTHORIZED
    return JSONResponse(status_code=status_code, content=result)


@app.post(
    "/tokens/revoke",
    tags=["tokens"],
    summary="Revoke a token",
    description="Revokes a token from the request body or from the Authorization header.",
    response_model=RevokeSuccessResponse,
    responses={
        400: {
            "model": RevokeFailureResponse,
            "description": "Token missing or invalid JSON payload.",
        },
        404: {
            "model": RevokeFailureResponse,
            "description": "Token not found.",
        },
    },
)
async def revoke_token(
    body: Annotated[
        TokenRequest | None,
        Body(
            openapi_examples={
                "body": {
                    "summary": "Send token in the JSON body",
                    "value": {"token": "your-issued-token"},
                }
            }
        ),
    ] = None,
    authorization: Annotated[
        str | None,
        Header(description="Optional Bearer token header. Example: `Bearer <token>`."),
    ] = None,
):
    token = token_from_request(body, authorization)
    if not token:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"revoked": False, "reason": "missing_token"},
        )

    result = require_store().revoke_token(token)
    status_code = status.HTTP_200_OK if result["revoked"] else status.HTTP_404_NOT_FOUND
    return JSONResponse(status_code=status_code, content=result)


def main():
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)


if __name__ == "__main__":
    main()
