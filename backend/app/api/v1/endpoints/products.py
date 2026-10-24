import time
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ....repositories import get_repository
from ....models.common import ApiResponse
from ....models.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(prefix="/products", tags=["Commodity & Spices Catalog"])
repo = get_repository("products")

@router.get("", response_model=ApiResponse[List[ProductResponse]])
def get_products(
    category: Optional[str] = Query(None, description="Category filter (e.g. 'Whole Spices')"),
    search: Optional[str] = Query(None, description="Search term for name or origin")
):
    filters = {}
    if category and category != "ALL":
        filters["category"] = category

    all_products = repo.get_all(filters=filters, limit=200)
    
    if search:
        s = search.lower()
        all_products = [
            p for p in all_products
            if s in p["name"].lower() or s in p["origin"].lower() or s in p["id"].lower()
        ]

    return ApiResponse(
        message=f"Retrieved {len(all_products)} commodity products",
        data=[ProductResponse(**p) for p in all_products]
    )

@router.get("/{id}", response_model=ApiResponse[ProductResponse])
def get_product_by_id(id: str):
    product = repo.get_by_id(id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with id {id} not found")
    return ApiResponse(data=ProductResponse(**product))

@router.post("", response_model=ApiResponse[ProductResponse], status_code=201)
def create_product(product_in: ProductCreate):
    new_id = f"PRD-{int(time.time() * 1000) % 1000000}"
    data = product_in.model_dump()
    data["id"] = new_id

    created = repo.create(data)
    return ApiResponse(
        message="Commodity product created successfully",
        data=ProductResponse(**created)
    )

@router.put("/{id}", response_model=ApiResponse[ProductResponse])
def update_product(id: str, product_in: ProductUpdate):
    existing = repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Product with id {id} not found")
    
    updated = repo.update(id, product_in.model_dump(exclude_unset=True))
    return ApiResponse(
        message="Product updated successfully",
        data=ProductResponse(**updated)
    )

@router.delete("/{id}", response_model=ApiResponse[dict])
def delete_product(id: str):
    existing = repo.get_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Product with id {id} not found")
    
    repo.delete(id)
    return ApiResponse(message=f"Product {id} deleted successfully", data={"id": id})
