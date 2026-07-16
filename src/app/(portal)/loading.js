import { Skeleton } from "@/components/ui";

// Inicio es la pantalla más pesada (ClickUp + agenda + notas + avisos), así que
// es la que más nota el loading: sin él, el clic en el menú se queda colgado
// hasta que responde el servidor. El esqueleto imita su estructura: fecha,
// saludo, frase, accesos y los dos módulos de abajo.
export default function Loading() {
  return (
    <div className="grid gap-8 lg:gap-12 items-start max-w-4xl mx-auto pb-[40vh] fade-up" aria-busy="true">
      <div className="min-w-0">
        {/* Fecha + refresh */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-8 !rounded-lg" />
        </div>

        {/* Saludo */}
        <Skeleton className="h-[44px] md:h-[64px] w-[65%] mb-7" />

        {/* Frase */}
        <div className="space-y-2.5 max-w-[44ch]">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-[80%]" />
        </div>

        {/* Accesos directos */}
        <div className="flex gap-2 mt-10">
          <Skeleton className="h-9 w-28 !rounded-full" />
          <Skeleton className="h-9 w-28 !rounded-full" />
        </div>

        {/* Lo más cercano + Tus tareas */}
        <div className="mt-8 space-y-4">
          <Skeleton className="h-[220px] !rounded-[28px]" />
          <Skeleton className="h-[180px] !rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
