export const dynamic = "force-dynamic";

const maxUploadBytes = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      {
        ok: false,
        error: "Choose an image file.",
      },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return Response.json(
      {
        ok: false,
        error: "Choose an image file.",
      },
      { status: 400 },
    );
  }

  if (file.size > maxUploadBytes) {
    return Response.json(
      {
        ok: false,
        error: "Image must be 10 MB or smaller.",
      },
      { status: 413 },
    );
  }

  return Response.json(
    {
      ok: false,
      error: "Headshot upload is not configured.",
      filename: file.name,
      sizeBytes: file.size,
      contentType: file.type,
      blocker: "No live MoDeck media upload endpoint or upload contract exists in this repo.",
    },
    { status: 501 },
  );
}
