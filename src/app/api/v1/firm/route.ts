import { NextRequest, NextResponse } from "next/server";
import { repo } from "@/lib/db/repo-v4";

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.cookies.get("finova_firm_profile")?.value;
    if (cookieHeader) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieHeader));
        if (parsed?.name) {
          repo.updateFirmProfile(parsed);
        }
      } catch (e) {}
    }
    const profile = repo.getFirmProfile();
    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch firm profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = repo.updateFirmProfile(body);
    const res = NextResponse.json({
      success: true,
      message: "Profil Kantor Akuntan Publik berhasil diperbarui.",
      data: updated,
    });
    res.cookies.set("finova_firm_profile", encodeURIComponent(JSON.stringify(updated)), {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update firm profile" },
      { status: 500 }
    );
  }
}
