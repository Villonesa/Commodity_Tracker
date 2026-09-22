import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import { mockNews } from "@/lib/mockData";

export default function Home() {
  return (
    <>
      <Header projectName="Commodities Tracker" />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockNews.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      </main>
    </>
  );
}
