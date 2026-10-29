import { pageMetadata } from "../../lib/site-pages";
export const metadata = {
  ...pageMetadata("/archive"),
  robots: { index: false, follow: true },
};
export default function PublicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
