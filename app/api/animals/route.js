import { NextResponse } from "next/server";
import { fetchAnimals } from "../../../utils/animals.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const animals = await fetchAnimals();
    return NextResponse.json(animals, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
