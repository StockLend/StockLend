import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Volta Loan - Institutional Grade Stock Lending",
  description: "Connect to the most trusted lending network for tokenized equities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
