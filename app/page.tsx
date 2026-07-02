import YearbookShell from "@/components/YearbookShell";
import { getStudents, getYearbookPages, getGalleryPhotos } from "@/lib/data";

// gallery photos are read live from public/gallery/ (dates, and even which
// files exist, can change between deploys) — force this route to render
// per-request instead of caching a stale snapshot from first build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const students = getStudents();
  const yearbookPages = getYearbookPages();
  // whole set, sorted oldest → recent by capture date
  const galleryPhotos = await getGalleryPhotos();

  return (
    <YearbookShell
      students={students}
      yearbookPages={yearbookPages}
      galleryPhotos={galleryPhotos}
    />
  );
}
