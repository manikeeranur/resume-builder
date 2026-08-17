import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const title = "Resume Pro – Build Professional Resumes That Get Noticed";
const description =
  "Create professional, job-ready resumes with Resume Pro. Build, customize, and polish your resume quickly with a simple experience designed to help you stand out.";
const socialDescription = "Create professional, job-ready resumes with Resume Pro and stand out to employers.";

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title,
  description,
  openGraph: {
    title,
    description: socialDescription,
    images: ["/meta.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: socialDescription,
    images: ["/meta.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
