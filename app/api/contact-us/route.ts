import { NextResponse } from "next/server";

const CONTACT_URL = "https://apiv2.ordrz.com/api/v1/public/contact-us";
const BUSINESS_ID = "7195b1ac-df99-46b2-8330-585b6562db0a";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      fields?: {
        rewardName?: string;
        rewardCode?: string;
      };
    };

    const rewardName = body.fields?.rewardName?.trim() ?? "";
    const rewardCode = body.fields?.rewardCode?.trim() ?? "";

    const payload = {
      businessId: BUSINESS_ID,
      type: "CONTACT",
      name: body.name?.trim() ?? "",
      email: body.email?.trim() ?? "",
      phone: body.phone?.trim() ?? "",
      fields: { rewardName, rewardCode },
    };

    if (!payload.name || !payload.email || !payload.phone || !rewardName || !rewardCode) {
      return NextResponse.json({ success: false, message: "Validation failed", details: null }, { status: 400 });
    }
    if (!/^\+923\d{9}$/.test(payload.phone)) {
      return NextResponse.json({ success: false, message: "Please enter a valid 11-digit mobile number.", details: null }, { status: 400 });
    }

    const response = await fetch(CONTACT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({ success: false, message: "Contact service unavailable." }));

    return NextResponse.json(result, { status: response.ok ? 200 : response.status || 502 });
  } catch {
    return NextResponse.json({ success: false, message: "Contact service unavailable.", details: null }, { status: 502 });
  }
}
