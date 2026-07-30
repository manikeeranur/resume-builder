import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

export const metadata = {
  title: "ResumePro — Build your perfect resume",
  description: "Create, customize, and download professional resumes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
