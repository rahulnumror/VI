from fastapi import APIRouter
from typing import Dict, Any, List
from ....core.database import db_manager
from ....models.common import ApiResponse

router = APIRouter(prefix="/reports", tags=["Analytics & Export Audit"])

@router.get("/export-revenue", response_model=ApiResponse[Dict[str, Any]])
def get_export_revenue_analytics():
    # Monthly breakdown for chart widgets
    data = {
        "fiscalYear": "2026",
        "totalExportUSD": 7000000.0,
        "totalImportUSD": 240000.0,
        "topCommodities": [
            {"commodity": "Whole Spices (Pepper & Cardamom)", "sharePercent": 48, "revenueUSD": 3360000.0},
            {"commodity": "Animal Feed (Rice DDGS & SBM)", "sharePercent": 32, "revenueUSD": 2240000.0},
            {"commodity": "Commodities & Grains (Rice & Tea)", "sharePercent": 20, "revenueUSD": 1400000.0}
        ],
        "regionalDistribution": [
            {"region": "Middle East (UAE & Saudi Arabia)", "cbm": 9800.5},
            {"region": "European Union (Germany & Netherlands)", "cbm": 6450.2},
            {"region": "Southeast Asia (Vietnam & Singapore)", "cbm": 4641.6}
        ]
    }
    return ApiResponse(message="Export revenue analytics retrieved", data=data)

@router.get("/audit-logs", response_model=ApiResponse[List[Dict[str, Any]]])
def get_audit_logs():
    logs = [
        {"id": "AUD-101", "action": "EXPORT_INVOICE_GENERATED", "user": "Vũ Thị Hoan", "detail": "Generated BL MEDU-BL-99201 for Dubai", "timestamp": "2026-09-05 14:20:10"},
        {"id": "AUD-102", "action": "FSSAI_LAB_SAMPLE_APPROVED", "user": "Rajesh Sharma", "detail": "Approved Moisture 11.2% for Black Pepper Lot 88", "timestamp": "2026-09-05 11:05:44"},
        {"id": "AUD-103", "action": "CONTAINER_SEAL_VERIFIED", "user": "Nguyễn Văn Hùng", "detail": "Customs seal verified at Hai Phong Berth 3", "timestamp": "2026-09-05 09:30:15"},
    ]
    return ApiResponse(data=logs)
