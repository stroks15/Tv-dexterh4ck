import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const db = supabaseAdmin();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const live = searchParams.get("live");
    let query = db.from("catalog_items").select("id,category_id,title,synopsis,poster_url,backdrop_url,stream_url,stream_type,source_name,release_year,duration_seconds,is_live,featured").eq("published", true).order("featured", {ascending:false}).order("created_at", {ascending:false}).limit(100);
    if (category && category !== "inicio") query = query.eq("category_id", category);
    if (live === "true") query = query.eq("is_live", true);
    if (q) query = query.ilike("title", `%${q.slice(0,80)}%`);
    const [{data:items,error}, {data:categories}] = await Promise.all([query, db.from("categories").select("id,name,description,sort_order").eq("active",true).order("sort_order")]);
    if (error) throw error;
    return NextResponse.json({items:items ?? [],categories:categories ?? []},{headers:{"Cache-Control":"s-maxage=30, stale-while-revalidate=120"}});
  } catch (error) { return NextResponse.json({error:error instanceof Error ? error.message : "No se pudo cargar el catálogo."},{status:500}); }
}