import { getGalleryPhotos } from "@/lib/data";
import DragCarousel from "@/components/DragCarousel";

export default function CarouselPage() {
  const photos = getGalleryPhotos().slice(0, 40).map((p) => p.src);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "var(--paper, #fdfaf2)",
      }}
    >
      <DragCarousel photos={photos} />
    </main>
  );
}
