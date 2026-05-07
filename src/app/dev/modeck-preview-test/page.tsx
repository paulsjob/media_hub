import { ModeckPreviewTest } from "@/components/modeck-preview-test";

export const dynamic = "force-dynamic";

export default function ModeckPreviewTestPage() {
  const configured = Boolean(process.env.MODECK_API_KEY && process.env.MODECK_API_BASE_URL);

  return (
    <ModeckPreviewTest
      configured={configured}
      defaults={{
        deck: process.env.MODECK_DEFAULT_DECK || "Quote Card",
        mogrt: process.env.MODECK_DEFAULT_MOGRT || process.env.MODECK_DEFAULT_DECK || "QuoteCard_16x9",
        size: "1920x1080",
        frame: 0,
        quote: "We cannot defend democracy by standing still.",
        speakerName: "Abigail Spanberger",
        speakerTitle: "U.S. Representative",
        contextLine: "April 2028 Town Hall in Michigan",
        headshotFilename: "",
      }}
    />
  );
}
