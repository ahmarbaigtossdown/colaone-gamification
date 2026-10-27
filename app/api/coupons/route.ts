import { NextResponse } from "next/server";

const COUPONS_URL = "https://apiv2.ordrz.com/api/v1/public/coupons/business/7195b1ac-df99-46b2-8330-585b6562db0a";

export async function GET() {
  try {
    const response = await fetch(COUPONS_URL, { cache: "no-store" });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, data: [], message: "Coupon service unavailable." }, { status: 502 });
    }

    return NextResponse.json(payload, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, data: [], message: "Coupon service unavailable." }, { status: 502 });
  }
}
