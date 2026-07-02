import YearbookShell from "@/components/YearbookShell";
import { getStudents, getYearbookPages, getGalleryPhotos } from "@/lib/data";

export default function Home() {
  const students = getStudents();
  const yearbookPages = getYearbookPages();
  // whole set, sorted oldest → recent by capture date (build-time manifest)
  const galleryPhotos = getGalleryPhotos();

  return (
    <YearbookShell
      students={students}
      yearbookPages={yearbookPages}
      galleryPhotos={galleryPhotos}
    />
  );
}
