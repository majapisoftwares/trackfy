import { apiError, jsonNoStore } from "@/src/lib/server/api-response";
import { getCommunityRating } from "@/src/lib/tracking/repository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaType: string; mediaId: string }> },
) {
  const { mediaType, mediaId } = await params;
  const id = Number.parseInt(mediaId, 10);
  if ((mediaType !== "movie" && mediaType !== "tv") || !Number.isInteger(id) || id < 1) {
    return apiError("INVALID_MEDIA", "Conteúdo inválido.", 400);
  }

  return jsonNoStore({ rating: await getCommunityRating(mediaType, id) });
}
