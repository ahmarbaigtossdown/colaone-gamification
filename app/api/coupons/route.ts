import { NextResponse } from "next/server";

const COUPONS_URL = "https://apiv2.ordrz.com/api/v1/public/coupons/business/7195b1ac-df99-46b2-8330-585b6562db0a";
const FALLBACK_COUPONS = [
  { code: "FIZZ15", name: "15% OFF", type: "PERCENTAGE", scope: "ORDER", value: 15, startAt: "", endAt: null },
  { code: "DOUBLEUP", name: "DOUBLE THE FIZZ", type: "BUY_X_GET_Y", scope: "ITEM", value: null, startAt: "", endAt: null },
  { code: "FREEFIZZ", name: "FREE FIZZ", type: "PERCENTAGE", scope: "ITEM", value: 100, startAt: "", endAt: null },
  { code: "FIZZ20", name: "20% OFF", type: "PERCENTAGE", scope: "ORDER", value: 20, startAt: "", endAt: null },
];

export async function GET() {
  try {
    const response = await fetch(COUPONS_URL, { cache: "no-store" });
    const payload = await response.json();

    if (response.ok && payload?.success === true && Array.isArray(payload?.data)) {
      return NextResponse.json(payload, { status: 200 });
    }
  } catch {
    // The wheel remains usable if the external coupon service is temporarily unreachable.
  }

  return NextResponse.json({ success: true, data: FALLBACK_COUPONS, fallback: true }, { status: 200 });
}
