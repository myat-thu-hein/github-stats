import './globals.css';

export const metadata = {
  title: 'GitHub Stats Dashboard',
  description: 'GitHub profile analytics: repositories, languages, contribution heatmap, streak stats. Portfolio Project Day 24.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
