import { getPublicStore } from "@/lib/store-utils";
import { ChatEmbed } from "./ChatEmbed";
import { ThemeProvider } from "@/components/public/ThemeProvider";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ChatPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const isEmbed = sp.embed === "1";
  const store = await getPublicStore(slug);

  return (
    <ThemeProvider>
      <div className={isEmbed ? "h-full w-full overflow-hidden" : "min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center"}>
        {store ? (
          <ChatEmbed store={store} isEmbed={isEmbed} />
        ) : (
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-1">Empresa no encontrada</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">El enlace no es válido o la empresa ya no está disponible.</p>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
