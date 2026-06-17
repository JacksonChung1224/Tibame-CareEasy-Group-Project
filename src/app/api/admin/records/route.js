import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    // 再次在後端確認密碼，防止無授權請求
    if (password !== "care2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 使用具備超級權限的 supabaseAdmin 抓取資料，這會繞過 RLS 的限制
    const { data, error } = await supabaseAdmin
      .from("assessment_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Admin fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
