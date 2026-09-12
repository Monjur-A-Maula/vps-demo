export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/s20230204060/vps-demo";

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans">
      <h1 className="text-4xl font-bold text-zinc-900">
        Welcome to the VPS Demo!
      </h1>
      <p className="mt-4 text-lg text-zinc-700">
        This is a demo of a VPS setup with Next.js and Express.js.
      </p>
      <a
        href={`${basePath}/api/`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Visit the Backend API
      </a>
    </div>
  );
}
