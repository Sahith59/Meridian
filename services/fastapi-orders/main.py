from fastapi import FastAPI, Header, HTTPException, Request
from boldsec.fastapi import BoldFastAPIConfig, add_bold

app = FastAPI(title="Meridian FastAPI Orders", version="1.0.0")

# BoLD must be wired before routes are registered.
add_bold(app, BoldFastAPIConfig(resolve_caller_id=lambda request: request.headers.get("x-user-id")))

ORDERS = {
    "1": {"id": "1", "owner_id": "userA", "amount": 125.50},
    "2": {"id": "2", "owner_id": "userB", "amount": 249.99},
}


@app.get("/")
def root():
    return {
        "service": "Meridian FastAPI Orders",
        "routes": ["/api/orders/1", "/api/orders/2"],
        "caller": "send X-User-Id: userA or userB",
    }


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/me")
def me(x_user_id: str | None = Header(default=None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    return {"id": x_user_id}


@app.get("/api/orders/{order_id}")
def get_order(order_id: str, request: Request):
    caller = request.headers.get("x-user-id")
    if not caller:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")

    order = ORDERS.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Intentional BOLA/IDOR: no check that order["owner_id"] == caller.
    return order


@app.get("/api/orders/{order_id}/secure")
def get_order_secure(order_id: str, request: Request):
    caller = request.headers.get("x-user-id")
    if not caller:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")

    order = ORDERS.get(order_id)
    if not order or order["owner_id"] != caller:
        raise HTTPException(status_code=404, detail="Order not found")

    return order
